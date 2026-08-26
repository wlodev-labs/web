import React from 'react'

export const formatComboboxItems = <T>(
    items: T[],
    formatter: (item: T) => {
        label: string
        value: string
    },
) => {
    return items.map(item => {
        const { label, value } = formatter(item)
        return {
            label,
            value,
        }
    })
}

export const useComboboxItems = <T>(
    items: T[],
    formatter: (item: T) => {
        label: string
        value: string
    },
) =>
    React.useMemo(
        () => formatComboboxItems(items, formatter),
        [items, formatter],
    )
