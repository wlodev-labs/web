import React from 'react'
import type { Locale } from 'date-fns'
import { enUS } from 'date-fns/locale'

export type PackageConfig = {
    dateFNSLocale: Locale
}

const defaultPackageConfig: PackageConfig = {
    dateFNSLocale: enUS,
}

let packageConfig: PackageConfig = { ...defaultPackageConfig }

export const changePackageConfig = (config: Partial<PackageConfig>) => {
    packageConfig = { ...packageConfig, ...config }
}

export const resetPackageConfig = () => {
    packageConfig = { ...defaultPackageConfig }
}

export const getPackageConfig = (): Readonly<PackageConfig> => {
    return packageConfig
}

export type AppConfigSchemaShape = Record<string, unknown>

export type StorageLike = {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
}

export type AppConfigOptions<TSchema extends AppConfigSchemaShape> = {
    /**
     * Default values used when nothing is stored yet, or when reading/parsing
     * fails.
     */
    defaults: TSchema
    /**
     * Optional prefix so multiple apps can share one origin without clobbering
     * each other's keys.
     */
    prefix?: string
    /**
     * Storage implementation. Defaults to window.localStorage.
     */
    storage?: StorageLike
    /**
     * Called on serialization / quota errors.
     */
    onError?: (
        error: unknown,
        context: { key: string; op: 'get' | 'set' | 'remove' },
    ) => void
}

export type AppConfig<TSchema extends AppConfigSchemaShape> = {
    get<K extends keyof TSchema & string>(
        key: K,
        fallback?: TSchema[K],
    ): TSchema[K]
    set<K extends keyof TSchema & string>(key: K, value: TSchema[K]): void
    remove<K extends keyof TSchema & string>(key: K): void
    getAll(): TSchema
    reset<K extends keyof TSchema & string>(key?: K): void
    /**
     * Subscribe to changes for a single key. Fires for both same-tab writes and
     * cross-tab `storage` events. Returns an unsubscribe function.
     */
    subscribe<K extends keyof TSchema & string>(
        key: K,
        listener: (value: TSchema[K]) => void,
    ): () => void
    /** The resolved storage key, useful for debugging. */
    storageKey(key: keyof TSchema & string): string
}

const memoryStorage = (): StorageLike => {
    const map = new Map<string, string>()
    return {
        getItem: k => map.get(k) ?? null,
        setItem: (k, v) => void map.set(k, v),
        removeItem: k => void map.delete(k),
    }
}

const resolveStorage = (provided?: StorageLike): StorageLike => {
    if (provided) return provided
    if (typeof window !== 'undefined' && window.localStorage)
        return window.localStorage
    return memoryStorage()
}

/**
 * Creates a new app config instance with the given options.
 * @param options - The configuration options for the app config.
 * @returns An instance of AppConfig with methods to get, set, remove, and subscribe to config values.
 */
export const createAppConfig = <TSchema extends AppConfigSchemaShape>({
    storage: providedStorage,
    defaults,
    prefix = '',
    onError,
}: AppConfigOptions<TSchema>): AppConfig<TSchema> => {
    const storage = resolveStorage(providedStorage)

    const notify = (fullKey: string, newValue: string | null) => {
        if (typeof window === 'undefined') {
            return
        }

        window.dispatchEvent(
            new StorageEvent('storage', {
                key: fullKey,
                newValue,
                storageArea: storage as Storage,
            }),
        )
    }

    const config: AppConfig<TSchema> = {
        storageKey: key => withPrefix(key, prefix),
        get(key, fallback) {
            const resolvedFallback = (fallback ??
                defaults[key]) as TSchema[typeof key]
            try {
                const raw = storage.getItem(withPrefix(key, prefix))
                return raw !== null
                    ? (JSON.parse(raw) as TSchema[typeof key])
                    : resolvedFallback
            } catch (error) {
                onError?.(error, { key, op: 'get' })
                return resolvedFallback
            }
        },
        set(key, value) {
            const fullKey = withPrefix(key, prefix)
            try {
                const stringified = JSON.stringify(value)
                storage.setItem(fullKey, stringified)
                notify(fullKey, stringified)
            } catch (error) {
                onError?.(error, { key, op: 'set' })
            }
        },
        remove(key) {
            const fullKey = withPrefix(key, prefix)
            try {
                storage.removeItem(fullKey)
                notify(fullKey, null)
            } catch (error) {
                onError?.(error, { key, op: 'remove' })
            }
        },
        getAll() {
            const result = { ...defaults }
            for (const key of Object.keys(defaults) as (keyof TSchema &
                string)[]) {
                result[key] = config.get(key)
            }
            return result
        },
        reset(key) {
            if (typeof key === 'undefined') {
                for (const k of Object.keys(defaults) as (keyof TSchema &
                    string)[]) {
                    config.remove(k)
                }
                return
            }
            config.remove(key)
        },
        subscribe(key, listener) {
            if (typeof window === 'undefined') {
                return () => {}
            }

            const fullKey = withPrefix(key, prefix)
            const handler = (event: Event) => {
                const storageEvent = event as StorageEvent
                // key === null means storage.clear() was called
                if (storageEvent.key !== null && storageEvent.key !== fullKey) {
                    return
                }

                listener(config.get(stripPrefix(fullKey, prefix) as typeof key))
            }
            window.addEventListener('storage', handler)
            return () => window.removeEventListener('storage', handler)
        },
    }
    return config
}

/**
 * Creates a set of React hooks for accessing and manipulating app config values.
 * @param config - The app config instance created by `createAppConfig`.
 * @returns An object containing the `useAppConfig` hook for accessing and manipulating config values.
 */
export const createAppConfigHooks = <TSchema extends AppConfigSchemaShape>(
    config: AppConfig<TSchema>,
) => {
    function useAppConfig<K extends keyof TSchema & string>(key: K) {
        const subscribe = React.useCallback(
            (onStoreChange: () => void) => config.subscribe(key, onStoreChange),
            [key],
        )

        const value = React.useSyncExternalStore(
            subscribe,
            () => config.get(key),
            () => config.get(key),
        )

        const setValue = React.useCallback(
            (next: TSchema[K] | ((prev: TSchema[K]) => TSchema[K])) => {
                const resolved =
                    typeof next === 'function'
                        ? (next as (prev: TSchema[K]) => TSchema[K])(
                              config.get(key),
                          )
                        : next
                config.set(key, resolved)
            },
            [key],
        )

        const removeValue = React.useCallback(() => config.remove(key), [key])

        return [value, setValue, removeValue] as const
    }
    return { useAppConfig }
}

const withPrefix = (key: string, prefix: string) =>
    prefix ? `${prefix}${key}` : key

const stripPrefix = (key: string, prefix: string) =>
    prefix && key.startsWith(prefix) ? key.slice(prefix.length) : key
