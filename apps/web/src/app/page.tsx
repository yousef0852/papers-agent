import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroSandboxLoader } from '@/components/landing/HeroSandboxLoader'
import { FoundingMember } from '@/components/landing/FoundingMember'
import { BrandLogo } from '@/components/BrandLogo'
import './landing.css'

export const metadata: Metadata = {
  title: 'AI Mind — The History of Artificial Intelligence, mapped as you learn it',
  description:
    'Chat with a scholarly AI tutor. Every concept grows your personal timeline — a notebook that becomes more valuable with every session.',
}

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <Link href="/" className="landing-brand" style={{ textDecoration: 'none' }}>
          <BrandLogo size={24} />
          AI Mind
        </Link>
        <Link href="/app" className="btn-primary">Open notebook →</Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-ornament">❧</div>
          <h1 className="landing-headline">
            The History of Artificial Intelligence,{' '}
            <em>mapped as you learn it.</em>
          </h1>
          <p className="landing-body">
            Chat with a scholarly AI tutor. Every concept becomes a permanent
            node on your personal timeline — a notebook that grows more
            valuable with every session.
          </p>
          <div className="landing-actions">
            <Link href="/app" className="btn-primary">Open your notebook →</Link>
            <a href="#how-it-works" className="btn-ghost">How it works ↓</a>
          </div>
        </div>

        <div className="sandbox-outer">
          <HeroSandboxLoader />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="landing-hiw">
        <div className="section-label">How it works</div>
        <h2 className="landing-section-title">Three steps. One growing notebook.</h2>
        <div className="hiw-grid">
          <div className="hiw-step">
            <div className="hiw-num">01</div>
            <h3 className="hiw-title">Ask</h3>
            <p className="hiw-body">
              Chat about any AI paper, researcher, or concept. The tutor answers
              with scholarly context — not a search result, but a considered
              explanation.
            </p>
          </div>
          <div className="hiw-step">
            <div className="hiw-num">02</div>
            <h3 className="hiw-title">Map</h3>
            <p className="hiw-body">
              Every idea you discuss is placed on an interactive timeline. Edges
              connect concepts that precede, enable, or inspired each other.
            </p>
          </div>
          <div className="hiw-step">
            <div className="hiw-num">03</div>
            <h3 className="hiw-title">Return</h3>
            <p className="hiw-body">
              Your notebook persists across every session. The more you explore,
              the richer the map — a personal history of AI you built yourself.
            </p>
          </div>
        </div>
      </section>

      {/* ── Founding members / pricing ───────────────────────────────────── */}
      <FoundingMember />

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="landing-footer-cta">
        <h2>Your notebook is waiting.</h2>
        <p>
          Start with a question about the Perceptron, the Transformer, or
          anything in between.
        </p>
        <Link href="/app" className="btn-primary">Open AI Mind →</Link>
      </section>
    </div>
  )
}
