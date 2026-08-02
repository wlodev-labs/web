import React from 'react'

const breakpoints = {
    mobile: 768,
    lg: 1024,
} as const
export type PredefinedBreakpoints = keyof typeof breakpoints

export const useMediaQuery = (width: number | PredefinedBreakpoints) => {
    const [targetReached, setTargetReached] = React.useState(false)
    const widthValue = typeof width === 'number' ? width : breakpoints[width]

    React.useEffect(() => {
        const updateTarget = (e: MediaQueryListEvent) => {
            setTargetReached(e.matches)
        }

        const media = window.matchMedia(`(max-width: ${widthValue}px)`)

        if (media.matches) {
            setTargetReached(true)
        }

        media.addEventListener('change', updateTarget)

        return () => media.removeEventListener('change', updateTarget)
    }, [width])

    return targetReached
}
