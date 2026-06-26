'use client'

import { useLocale } from '@/lib/i18n'

export function LangToggle() {
  const { locale, setLocale } = useLocale()
  const isAR = locale === 'ar'

  return (
    <div className="lang-toggle" role="group" aria-label="Language / اللغة">
      <div className={`lang-toggle-thumb${isAR ? ' lang-toggle-thumb--ar' : ''}`} aria-hidden="true" />
      <button
        className={`lang-toggle-opt${!isAR ? ' lang-toggle-opt--active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={!isAR}
      >
        EN
      </button>
      <button
        className={`lang-toggle-opt${isAR ? ' lang-toggle-opt--active' : ''}`}
        onClick={() => setLocale('ar')}
        aria-pressed={isAR}
      >
        AR
      </button>
    </div>
  )
}
