'use client'

import { useState } from 'react'
import { API_BASE_URL } from '@/lib/config'
import { capture } from '@/lib/analytics'
import { useLocale } from '@/lib/i18n'

type Status = 'idle' | 'loading' | 'done' | 'error'

export function FoundingMember() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const { t } = useLocale()

  const TIERS = [
    {
      name: t.tier_free_name,
      price: t.tier_free_price,
      cadence: '',
      blurb: t.tier_free_blurb,
      points: t.tier_free_points,
    },
    {
      name: t.tier_scholar_name,
      price: t.tier_scholar_price,
      cadence: '/mo',
      blurb: t.tier_scholar_blurb,
      points: t.tier_scholar_points,
      featured: true,
    },
    {
      name: t.tier_patron_name,
      price: t.tier_patron_price,
      cadence: '/mo',
      blurb: t.tier_patron_blurb,
      points: t.tier_patron_points,
    },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!value || !value.includes('@')) {
      setStatus('error')
      return
    }
    setStatus('loading')
    capture('founding_member_clicked', { email_domain: value.split('@')[1] ?? '' })
    try {
      const res = await fetch(`${API_BASE_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source: 'founding_member' }),
      })
      if (!res.ok) throw new Error(`waitlist ${res.status}`)
      capture('waitlist_joined', { source: 'founding_member' })
      setStatus('done')
      setEmail('')
    } catch (err) {
      console.warn('waitlist failed', err)
      setStatus('error')
    }
  }

  return (
    <section className="landing-pricing" id="founding">
      <div className="section-label">{t.founding_label}</div>
      <h2 className="landing-section-title">
        {t.founding_title_plain} <em>{t.founding_title_em}</em> {t.founding_title_suffix}
      </h2>

      <div className="pricing-grid">
        {TIERS.map((tier) => (
          <div key={tier.name} className={`pricing-card${tier.featured ? ' pricing-card--featured' : ''}`}>
            <div className="pricing-name">{tier.name}</div>
            <div className="pricing-price">
              {tier.price}
              {tier.cadence && <span className="pricing-cadence">{tier.cadence}</span>}
            </div>
            <div className="pricing-blurb">{tier.blurb}</div>
            <ul className="pricing-points">
              {(tier.points as readonly string[]).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <form className="founding-form" onSubmit={handleSubmit}>
        {status === 'done' ? (
          <p className="founding-done">{t.founding_done}</p>
        ) : (
          <>
            <input
              type="email"
              className="founding-input"
              placeholder={t.email_placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              required
            />
            <button type="submit" className="btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? t.reserving : t.reserve_btn}
            </button>
          </>
        )}
        {status === 'error' && (
          <p className="founding-error">{t.founding_error}</p>
        )}
      </form>
      <p className="founding-fineprint">{t.founding_fineprint}</p>
    </section>
  )
}
