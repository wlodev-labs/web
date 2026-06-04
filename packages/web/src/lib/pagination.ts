import React from 'react'
import type { InfiniteData } from '@tanstack/react-query'

type BaseResponse = {
    data: {
        pagination: {
            count: number
            next: string | null
            prev: string | null
        }
    }
}

/**
 * Standarizes the logic for determining the next page parameter from paginated API responses.
 * response: is just the scaffolding around the actual response data.
 */
export const getNextPageParam = (
    response: BaseResponse | {},
    limit: number,
) => {
    if (!('data' in response) || !('pagination' in response.data)) {
        // Malformed pagination response data
        return null
    }

    const { pagination } = response.data
    if (!pagination.next) {
        // No more pages or malformed pagination response data
        return null
    }

    if (pagination.count < limit) {
        // No more pages
        return null
    }
    return pagination.next
}

type FlattenedItem<TPage> = TPage extends {
    data: { data: ReadonlyArray<infer TItem> }
}
    ? TItem
    : never

/**
 * Flattens the paginated data coming from tanstack query's useInfiniteQuery into a single array of items
 * and returns strongly typed array of items.
 */
export const flattenPaginatedData = <
    TPage extends { status: number; data: unknown },
    TPageParam = unknown,
>(
    data: InfiniteData<TPage, TPageParam> | undefined,
): FlattenedItem<TPage>[] => {
    return (data?.pages.flatMap(page => {
        const list = (page.data as { data?: unknown }).data
        return Array.isArray(list) ? list : []
    }) ?? []) as FlattenedItem<TPage>[]
}

export const useFlattenPaginatedData = <
    TPage extends { status: number; data: unknown },
    TPageParam = unknown,
>(
    data: InfiniteData<TPage, TPageParam> | undefined,
): FlattenedItem<TPage>[] =>
    React.useMemo(() => flattenPaginatedData(data), [data])
