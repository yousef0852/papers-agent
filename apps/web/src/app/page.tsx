import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroSandboxLoader } from '@/components/landing/HeroSandboxLoader'
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
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="5" fill="#A67C52"/>
            <circle cx="6" cy="8" r="3" fill="#A67C52" opacity="0.7"/>
            <circle cx="22" cy="8" r="3.5" fill="#A67C52" opacity="0.85"/>
            <circle cx="5" cy="20" r="2.5" fill="#7A9B7F" opacity="0.8"/>
            <circle cx="22" cy="20" r="2" fill="#7A9B7F" opacity="0.7"/>
            <circle cx="14" cy="4" r="2" fill="#A67C52" opacity="0.5"/>
            <line x1="14" y1="14" x2="6" y2="8" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="22" y2="8" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="5" y2="20" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="22" y2="20" stroke="#C9B8A8" strokeWidth="1"/>
            <line x1="14" y1="14" x2="14" y2="4" stroke="#C9B8A8" strokeWidth="1"/>
          </svg>
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
