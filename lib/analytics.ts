import posthog from 'posthog-js'

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

let initialized = false

export function initAnalytics() {
  if (initialized || typeof window === 'undefined' || !KEY) return
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: 'identified_only',
  })
  initialized = true
}

export function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !KEY) return
  initAnalytics()
  try {
    posthog.capture(event, props)
  } catch {}
}
