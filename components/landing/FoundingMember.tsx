'use client'

import { useState } from 'react'
import { API_BASE_URL } from '@/lib/config'
import { capture } from '@/lib/analytics'

type Status = 'idle' | 'loading' | 'done' | 'error'

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    cadence: '',
    blurb: 'Try the notebook',
    points: ['1 notebook', '30 tutor turns / mo', 'Full canvas'],
  },
  {
    name: 'Scholar',
    price: '$12',
    cadence: '/mo',
    blurb: 'The whole product',
    points: ['Unlimited nodes', '500 tutor turns / mo', 'Export · spaced review'],
    featured: true,
  },
  {
    name: 'Patron',
    price: '$24',
    cadence: '/mo',
    blurb: 'For power users',
    points: ['Everything unlimited', 'Priority model', 'Early features'],
  },
]

export function FoundingMember() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

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
      <div className="section-label">Founding members</div>
      <h2 className="landing-section-title">
        Free in beta. <em>$7/mo for life</em> for the first 200.
      </h2>

      <div className="pricing-grid">
        {TIERS.map((t) => (
          <div key={t.name} className={`pricing-card${t.featured ? ' pricing-card--featured' : ''}`}>
            <div className="pricing-name">{t.name}</div>
            <div className="pricing-price">
              {t.price}
              {t.cadence && <span className="pricing-cadence">{t.cadence}</span>}
            </div>
            <div className="pricing-blurb">{t.blurb}</div>
            <ul className="pricing-points">
              {t.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <form className="founding-form" onSubmit={handleSubmit}>
        {status === 'done' ? (
          <p className="founding-done">
            You&rsquo;re on the list. We&rsquo;ll email your founding-member invite soon.
          </p>
        ) : (
          <>
            <input
              type="email"
              className="founding-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              required
            />
            <button type="submit" className="btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Reserving…' : 'Reserve my spot →'}
            </button>
          </>
        )}
        {status === 'error' && (
          <p className="founding-error">Please enter a valid email and try again.</p>
        )}
      </form>
      <p className="founding-fineprint">
        No charge now. We&rsquo;ll only email you when your invite is ready.
      </p>
    </section>
  )
}
