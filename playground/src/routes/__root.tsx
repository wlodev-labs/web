import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { VersionProvider, type VersionQueryOptions } from '@wlodev/web'
import { QueryClient, useQuery } from '@tanstack/react-query'

import '../styles.css'

type RouterContext = {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})

type MockVersionApiResponse = {
    data: {
        buildId: string
        buildDate: string
    }
}

export function useVersionGet(options: VersionQueryOptions) {
    return useQuery({
        queryKey: ['app-version'],
        queryFn: async (): Promise<MockVersionApiResponse> => {
            await new Promise(resolve => setTimeout(resolve, 300))
            return {
                data: {
                    buildId: `dummy`,
                    buildDate: new Date().toISOString(),
                },
            }
        },
        ...options,
    })
}

function RootComponent() {
    const activeBuildId = 'initial'
    return (
        <>
            <VersionProvider
                activeBuildId={activeBuildId}
                useVersionQuery={versionQueryOptions =>
                    useVersionGet(versionQueryOptions)
                }
                extractData={({ data }) => {
                    return {
                        buildId: data.buildId,
                        buildDate: data.buildDate,
                    }
                }}
            >
                <Outlet />
            </VersionProvider>
            <TanStackDevtools
                config={{
                    position: 'bottom-right',
                }}
                plugins={[
                    {
                        name: 'TanStack Router',
                        render: <TanStackRouterDevtoolsPanel />,
                    },
                ]}
            />
        </>
    )
}
