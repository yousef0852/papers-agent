'use client'

import dynamic from 'next/dynamic'
import { HeroSandboxSkeleton } from './HeroSandboxSkeleton'

const HeroSandbox = dynamic(
  () => import('./HeroSandbox'),
  { ssr: false, loading: () => <HeroSandboxSkeleton /> },
)

export function HeroSandboxLoader() {
  return <HeroSandbox />
}
