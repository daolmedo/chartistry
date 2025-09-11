'use client'

import { useEffect } from "react"
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init("phc_i5P5GiNAgn6GC09KeA9gIT7N3NFvzw2TjuWNc60CZR2", {
      api_host: "https://eu.i.posthog.com",
      person_profiles: 'identified_only',
      defaults: '2025-05-24'
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}