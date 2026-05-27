import { ApiDownError, isApiDown } from './errors'

export type CustomFetchOptions = Omit<RequestInit, 'searchParams'> & {
    searchParams?: Record<string, string>
}

export type CustomFetchClientOptions = {
    onRefreshToken: () => Promise<void>
}

export const createFetchClient = ({
    onRefreshToken,
}: CustomFetchClientOptions) => {
    let isRefreshing = false
    let refreshSubscribers: Array<(...args: any[]) => void> = []

    const subscribeTokenRefresh = (cb: (...args: any[]) => void) => {
        refreshSubscribers.push(cb)
    }

    const onTokenRefreshComplete = () => {
        refreshSubscribers.forEach(cb => cb())
        refreshSubscribers = []
    }

    const refreshToken = async () => {
        isRefreshing = true
        try {
            await onRefreshToken()
        } catch (err) {
            console.error('Token refresh failed:', err)
        } finally {
            isRefreshing = false
            onTokenRefreshComplete()
        }
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
                if (isRefreshing) {
                    await new Promise(resolve => subscribeTokenRefresh(resolve))
                } else {
                    await refreshToken()
                }
                // Once the token is refreshed, perform the queued requests and retry the original request
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
            // By throwing the parsed JSON body directly, TanStack Query catches it
            // and populates the `error` property with your exact typed OpenAPI object.
            throw data
        }
        return { status: response.status, data, headers: response.headers } as T
    }
    return customFetch
}
