import type { DefaultOptions } from '@tanstack/react-query'
import { ApiDownError } from './errors'

export const getTanstackQueryDefaultOptions = (): DefaultOptions => ({
    queries: {
        refetchOnWindowFocus: 'always',
        refetchOnReconnect: 'always',
        retry: (failureCount, error) => {
            if (error instanceof ApiDownError) {
                return false
            }
            return failureCount < 5
        },
        throwOnError: error => {
            if (error instanceof ApiDownError) {
                return true
            }
            return false
        },
    },
})
