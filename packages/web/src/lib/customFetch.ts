import { ApiDownError, isApiDown } from './errors'

export type CustomFetchOptions = Omit<RequestInit, 'searchParams'> & {
    searchParams?: Record<string, string>
}

export type CustomFetchClientOptions = {
    onRefreshToken: () => Promise<void>
}

export const createCustomFetch = ({
    onRefreshToken,
}: CustomFetchClientOptions) => {
    let refreshPromise: Promise<void> | null = null

    const refreshToken = () => {
        refreshPromise ??= onRefreshToken()
            .catch(err => {
                console.error('Token refresh failed:', err)
            })
            .finally(() => {
                refreshPromise = null
            })
        return refreshPromise
    }

    const customFetch = async <T>(
        url: string,
        options: CustomFetchOptions = {},
    ): Promise<T> => {
        let requestUrl = url
        if (options.searchParams) {
            const searchParams = new URLSearchParams(
                options.searchParams,
            ).toString()
            requestUrl += requestUrl.includes('?')
                ? `&${searchParams}`
                : `?${searchParams}`
        }

        const { searchParams, ...fetchOptions } = options
        let response: Response
        try {
            response = await fetch(requestUrl, fetchOptions)
            if (response.status === 401) {
                await refreshToken()
                response = await fetch(requestUrl, fetchOptions)
            }
        } catch (err) {
            if (err instanceof TypeError) {
                throw new ApiDownError()
            }
            throw err
        }

        // Prevent parsing empty response bodies
        const responseText = await response.text()
        const data = responseText ? JSON.parse(responseText) : {}
        if (isApiDown({ status: response.status, data })) {
            throw new ApiDownError()
        } else if (!response.ok) {
            // By throwing the parsed JSON body directly, TanStack Query catches
            // it and populates the `error` property with your exact typed
            // OpenAPI object.
            throw data
        }
        return { status: response.status, data, headers: response.headers } as T
    }
    return customFetch
}
