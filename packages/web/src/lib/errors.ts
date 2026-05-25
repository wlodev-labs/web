export class ApiDownError extends Error {
    constructor() {
        super('Request failed because the API is down')
        this.name = 'ApiDownError'
    }
}

export const isApiDown = (data: {
    status: number
    data: Record<string, any>
}) => {
    return (
        (data.status === 500 || data.status === 502) && !('error' in data.data)
    )
}

/**
 * Primary function to extract error code from the generated API function error response.
 * If the error response doesn't match the expected structure, it returns null to let the
 * try catch logic just rethrow the error and be handled by the global error boundary.
 */
export const getApiErrorCode = <TError extends { data: Record<string, any> }>(
    err: unknown,
): TError['data']['error']['code'] | null => {
    if (
        err &&
        typeof err === 'object' &&
        err !== null &&
        !Array.isArray(err) &&
        'error' in err
    ) {
        const apiErr = err as Record<string, any>
        return apiErr.error?.code
    }
    return null
}
