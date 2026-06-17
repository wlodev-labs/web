import React from 'react'

export type VersionQueryData = {
    buildId: string
    buildDate: string
}

export type VersionQueryOptions = {
    refetchInterval: number
    retry: boolean
}

export type VersionContextProps = {
    updateAvailable: boolean
    isDismissed: boolean
    dismiss: () => void
    buildId: string | null
}

const VersionContext = React.createContext<VersionContextProps | null>(null)

export type VersionProviderProps<TData> = {
    children: React.ReactNode
    activeBuildId: string
    useVersionQuery: (options: VersionQueryOptions) => {
        data?: {
            data: TData
        }
    }
    extractData: (data: TData) => VersionQueryData
}

export const VersionProvider = <TData,>({
    children,
    activeBuildId,
    useVersionQuery,
    extractData,
}: VersionProviderProps<TData>) => {
    const [updateAvailable, setUpdateAvailable] = React.useState(false)
    const [isDismissed, setIsDismissed] = React.useState(false)
    const [buildId, setBuildId] = React.useState<string | null>(null)

    const { data: rawData } = useVersionQuery({
        refetchInterval: 10 * 1000,
        retry: false,
    })

    React.useEffect(() => {
        if (!rawData) {
            return
        }

        const { buildId } = extractData(rawData.data)
        setBuildId(buildId)
        // Check for the active build ID and set proper version status
        if (buildId !== activeBuildId) {
            setUpdateAvailable(true)
        } else {
            setUpdateAvailable(false)
        }
    }, [rawData, activeBuildId])

    const dismiss = React.useCallback(() => {
        setIsDismissed(true)
    }, [])

    return (
        <VersionContext.Provider
            value={{
                updateAvailable,
                isDismissed,
                dismiss,
                buildId,
            }}
        >
            {children}
        </VersionContext.Provider>
    )
}

export const useVersion = () => {
    const context = React.useContext(VersionContext)
    if (context === null) {
        throw new Error('useVersion must be used within a VersionProvider')
    }
    return context
}
