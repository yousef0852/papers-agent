import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/lib/types'
import { useSuggestions } from '@/lib/suggestions'
import { useLocale } from '@/lib/i18n'

interface ChatPanelProps {
  messages: ChatMessage[]
  pending?: boolean
  onSendMessage: (text: string) => void
  open: boolean
  fullscreen: boolean
  onClose: () => void
  onToggleFullscreen: () => void
}

export function ChatPanel({ messages, pending, onSendMessage, open, fullscreen, onClose, onToggleFullscreen }: ChatPanelProps) {
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { locale, t } = useLocale()
  const { suggestion } = useSuggestions(locale)

  const isEmpty = messages.length === 0 && !pending

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending, open])

  function submit() {
    const text = draft.trim()
    if (!text || pending) return
    setDraft('')
    onSendMessage(text)
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function firePrompt(text: string) {
    setDraft('')
    onSendMessage(text)
  }

  const overlayClass = ['chat-overlay', open ? 'open' : '', fullscreen ? 'fullscreen' : ''].filter(Boolean).join(' ')
  const innerClass = ['chat-inner', isEmpty ? 'chat-inner--empty' : ''].filter(Boolean).join(' ')

  return (
    <div className={overlayClass} role="dialog" aria-modal="true" aria-label={t.ai_tutor_label}>
      <div className="chat-page">
        <header className="chat-head">
          <div>
            <div className="chat-title">{t.chat_title}</div>
            <div className="chat-sub">{t.chat_sub}</div>
          </div>
          <div className="chat-head-actions">
            <button
              className="chat-head-btn"
              onClick={onToggleFullscreen}
              title={fullscreen ? t.exit_fullscreen : t.fullscreen}
            >
              {fullscreen ? (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M9.5 1h4.5v4.5M5.5 14H1v-4.5M14 1l-5 5M1 14l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 5.5V1h4.5M9.5 1H14v4.5M14 9.5V14H9.5M5.5 14H1V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </button>
            <button className="chat-head-btn" onClick={onClose} title={t.close}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </header>

        <div className={innerClass}>
          {isEmpty ? (
            <div className="chat-hero">
              <div className="hero-body">
                <div className="hero-ornament">❧</div>
                {suggestion && (
                  <>
                    <h1 className="hero-title">{suggestion.title}</h1>
                    <p className="hero-sub">{suggestion.sub}</p>
                    <div className="hero-prompts">
                      {suggestion.prompts.map((p) => (
                        <button key={p} className="prompt-chip" onClick={() => firePrompt(p)} disabled={pending}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="composer composer--hero">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={t.placeholder_hero}
                  disabled={pending}
                  rows={3}
                  autoFocus={open}
                  dir="auto"
                />
                <div className="composer-row">
                  <span className="composer-hint">{t.enter_hint}</span>
                  <button className="send-btn" onClick={submit} disabled={pending || !draft.trim()}>
                    {t.send}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="chat-scroll" ref={scrollRef}>
                {messages.map((m, i) => (
                  <div className={`msg ${m.role}`} key={i}>
                    <div className="msg-meta">
                      <span>{m.role === 'user' ? t.you : t.tutor}</span>
                      {m.addedNodes ? (
                        <span className="meta-tag">{t.node_count(m.addedNodes)}</span>
                      ) : null}
                      {m.addedAnnots ? (
                        <span className="meta-tag">{t.note_count(m.addedAnnots)}</span>
                      ) : null}
                    </div>
                    <div className="msg-body">{m.content}</div>
                  </div>
                ))}
                {pending && (
                  <div className="msg assistant">
                    <div className="msg-meta"><span>{t.tutor}</span></div>
                    <div className="msg-body">
                      <span className="thinking">
                        {t.thinking}
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="composer">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={t.placeholder_chat}
                  disabled={pending}
                  rows={3}
                  dir="auto"
                />
                <div className="composer-row">
                  <span className="composer-hint">{t.enter_hint}</span>
                  <button className="send-btn" onClick={submit} disabled={pending || !draft.trim()}>
                    {t.send}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
