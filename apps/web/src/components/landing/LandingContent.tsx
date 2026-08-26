'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { HeroSandboxLoader } from './HeroSandboxLoader'
import { FoundingMember } from './FoundingMember'
import { BrandLogo } from '@/components/BrandLogo'
import { LangToggle } from '@/components/LangToggle'
import { ArrowIcon } from '@/components/ArrowIcon'
import { useLocale } from '@/lib/i18n'

const THEME_KEY = 'ai-mind-theme'

export function LandingContent() {
  const { t, isRTL } = useLocale()
  const fwd = isRTL ? 'left' : 'right'
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Sync with localStorage on mount (default: dark)
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  // Apply dark class to html element and persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <Link href="/" className="landing-brand" style={{ textDecoration: 'none' }}>
          <BrandLogo size={24} />
          AI Mind
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LangToggle />
          <button
            className="header-btn ghost"
            onClick={toggleTheme}
            title="Toggle theme"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {theme === 'dark' ? t.theme_dark : t.theme_light}
          </button>
          <Link href="/login" className="btn-ghost">{t.auth_sign_in}</Link>
          <Link href="/app" className="btn-primary arrow-link">
            {t.open_notebook}
            <ArrowIcon direction={fwd} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-ornament">{t.hero_ornament}</div>
          <h1 className="landing-headline">
            {t.hero_headline_main}{' '}
            <em>{t.hero_headline_em}</em>
          </h1>
          <p className="landing-body">{t.hero_body}</p>
          <div className="landing-actions">
            <Link href="/app" className="btn-primary arrow-link">
              {t.open_notebook_long}
              <ArrowIcon direction={fwd} />
            </Link>
            <a href="#how-it-works" className="btn-ghost arrow-link">
              {t.how_it_works_link}
              <ArrowIcon direction="down" />
            </a>
          </div>
        </div>

        <div className="sandbox-outer">
          <HeroSandboxLoader />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="landing-hiw">
        <div className="section-label">{t.how_it_works_label}</div>
        <h2 className="landing-section-title">{t.hiw_title}</h2>
        <div className="hiw-grid">
          <div className="hiw-step">
            <div className="hiw-num">{t.step1_num}</div>
            <h3 className="hiw-title">{t.step1_title}</h3>
            <p className="hiw-body">{t.step1_body}</p>
          </div>
          <div className="hiw-step">
            <div className="hiw-num">{t.step2_num}</div>
            <h3 className="hiw-title">{t.step2_title}</h3>
            <p className="hiw-body">{t.step2_body}</p>
          </div>
          <div className="hiw-step">
            <div className="hiw-num">{t.step3_num}</div>
            <h3 className="hiw-title">{t.step3_title}</h3>
            <p className="hiw-body">{t.step3_body}</p>
          </div>
        </div>
      </section>

      {/* ── Founding members / pricing ───────────────────────────────────── */}
      <FoundingMember />

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="landing-footer-cta">
        <h2>{t.footer_cta_title}</h2>
        <p>{t.footer_cta_body}</p>
        <Link href="/app" className="btn-primary arrow-link">
          {t.open_ai_mind}
          <ArrowIcon direction={fwd} />
        </Link>
      </section>
    </div>
  )
}
