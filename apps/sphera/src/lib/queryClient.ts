import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes in memory before stale
      gcTime: 30 * 60 * 1000,    // 30 minutes in garbage collection cache
      refetchOnWindowFocus: false,
      refetchOnMount: false,     // Avoid unneeded refetches when navigating between routes
      retry: 1,
    },
  },
})
