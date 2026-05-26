import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useVersion } from '@wlodev/web'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
    const { updateAvailable } = useVersion()

    React.useEffect(() => {
        console.log('Update available:', updateAvailable)
    }, [updateAvailable])

    return null
}
