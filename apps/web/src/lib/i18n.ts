'use client'

import { createElement, createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Locale = 'en' | 'ar'
export const LOCALE_KEY = 'ai-mind-locale'

// ── String dictionaries ────────────────────────────────────────────────────────

export const STRINGS = {
  en: {
    brand_tag: 'a personal natural history of machine intelligence',
    nodes_edges: (n: number, e: number) => `${n} nodes · ${e} edges`,
    theme_dark: '☽ Dark',
    theme_light: '☼ Light',
    export_btn: 'Export',
    reset_btn: 'Reset',
    resetting: 'Resetting…',
    loading: 'Opening your notebook…',
    folio: 'folio I',
    chat_fab: 'Chat with Tutor',
    canvas_subtitle: 'a private chart of how machines learned to think · 1940 — 2026',

    reset_modal_title: 'Reset notebook?',
    reset_modal_body:
      'All nodes, edges, and chat history will be cleared on this device and the server. This cannot be undone.',
    cancel: 'Cancel',
    notice_cleared: 'Notebook cleared.',
    notice_failed: 'Reset failed — please try again.',

    chat_title: 'Knowledge Assistant',
    chat_sub: 'AI History Tutor',
    fullscreen: 'Full screen',
    exit_fullscreen: 'Exit full screen',
    close: 'Close',
    you: 'You',
    tutor: 'Tutor',
    thinking: 'thinking',
    placeholder_hero: 'Ask anything about the history of artificial intelligence…',
    placeholder_chat: 'Ask about any idea in the history of artificial intelligence…',
    enter_hint: 'enter to send · shift+enter newline',
    send: 'Send',
    ai_tutor_label: 'AI Tutor',
    node_count: (n: number) => `+${n} ${n === 1 ? 'node' : 'nodes'}`,
    note_count: (n: number) => `+${n} ${n === 1 ? 'note' : 'notes'}`,

    categories: {
      foundations: 'Foundations',
      vision: 'Vision',
      language: 'Language',
      rl: 'Reinforcement',
      architecture: 'Architecture',
      other: 'Other',
    },

    open_notebook: 'Open notebook →',
    open_notebook_long: 'Open your notebook →',
    how_it_works_link: 'How it works ↓',
    hero_ornament: '❧',
    hero_headline_main: 'The History of Artificial Intelligence,',
    hero_headline_em: 'mapped as you learn it.',
    hero_body:
      'Chat with a scholarly AI tutor. Every concept becomes a permanent node on your personal timeline — a notebook that grows more valuable with every session.',
    how_it_works_label: 'How it works',
    hiw_title: 'Three steps. One growing notebook.',
    step1_num: '01', step1_title: 'Ask',
    step1_body:
      'Chat about any AI paper, researcher, or concept. The tutor answers with scholarly context — not a search result, but a considered explanation.',
    step2_num: '02', step2_title: 'Map',
    step2_body:
      'Every idea you discuss is placed on an interactive timeline. Edges connect concepts that precede, enable, or inspired each other.',
    step3_num: '03', step3_title: 'Return',
    step3_body:
      'Your notebook persists across every session. The more you explore, the richer the map — a personal history of AI you built yourself.',
    footer_cta_title: 'Your notebook is waiting.',
    footer_cta_body:
      'Start with a question about the Perceptron, the Transformer, or anything in between.',
    open_ai_mind: 'Open AI Mind →',

    sandbox_chat_head: 'Knowledge Assistant',
    sandbox_user_label: 'You',
    sandbox_tutor_label: 'Tutor',
    sandbox_cta: 'Open your notebook →',
    sandbox_nudge: 'Start your own timeline →',
    sandbox_beat1_user: "Tell me about Rosenblatt's Perceptron",
    sandbox_beat2_tutor:
      "Rosenblatt's 1958 Perceptron was the first trainable neural network. It was born from the 1956 Dartmouth workshop — the gathering that coined the term 'artificial intelligence.'",
    sandbox_beat3_user: 'What theorem proved it works?',
    sandbox_beat4_tutor:
      'The 1962 Convergence Theorem proved the Perceptron always finds a solution if one exists — the first mathematical guarantee that a machine could learn.',

    founding_label: 'Founding members',
    founding_title_plain: 'Free in beta.',
    founding_title_em: '$7/mo for life',
    founding_title_suffix: 'for the first 200.',
    tier_free_name: 'Free', tier_free_price: '$0', tier_free_blurb: 'Try the notebook',
    tier_free_points: ['1 notebook', '30 tutor turns / mo', 'Full canvas'],
    tier_scholar_name: 'Scholar', tier_scholar_price: '$12', tier_scholar_blurb: 'The whole product',
    tier_scholar_points: ['Unlimited nodes', '500 tutor turns / mo', 'Export · spaced review'],
    tier_patron_name: 'Patron', tier_patron_price: '$24', tier_patron_blurb: 'For power users',
    tier_patron_points: ['Everything unlimited', 'Priority model', 'Early features'],
    email_placeholder: 'you@example.com',
    reserve_btn: 'Reserve my spot →',
    reserving: 'Reserving…',
    founding_done: "You're on the list. We'll email your founding-member invite soon.",
    founding_error: 'Please enter a valid email and try again.',
    founding_fineprint: "No charge now. We'll only email you when your invite is ready.",
  },

  ar: {
    brand_tag: 'تاريخ طبيعي شخصي للذكاء الاصطناعي',
    nodes_edges: (n: number, e: number) => `${n} عقدة · ${e} رابط`,
    theme_dark: '☽ داكن',
    theme_light: '☼ فاتح',
    export_btn: 'تصدير',
    reset_btn: 'إعادة تعيين',
    resetting: 'جارٍ الإعادة…',
    loading: 'جارٍ فتح دفترك…',
    folio: 'الورقة الأولى',
    chat_fab: 'محادثة مع المعلم',
    canvas_subtitle: 'خريطة خاصة لكيف تعلمت الآلات التفكير · ١٩٤٠ — ٢٠٢٦',

    reset_modal_title: 'إعادة تعيين الدفتر؟',
    reset_modal_body:
      'ستُحذف جميع العقد والروابط وسجل المحادثة من هذا الجهاز والخادم. لا يمكن التراجع عن هذا الإجراء.',
    cancel: 'إلغاء',
    notice_cleared: 'تم مسح الدفتر.',
    notice_failed: 'فشلت الإعادة — يرجى المحاولة مرة أخرى.',

    chat_title: 'المساعد المعرفي',
    chat_sub: 'مُعلِّم تاريخ الذكاء الاصطناعي',
    fullscreen: 'ملء الشاشة',
    exit_fullscreen: 'إنهاء ملء الشاشة',
    close: 'إغلاق',
    you: 'أنت',
    tutor: 'المعلم',
    thinking: 'يفكر',
    placeholder_hero: 'اسأل عن أي شيء في تاريخ الذكاء الاصطناعي…',
    placeholder_chat: 'اسأل عن أي فكرة في تاريخ الذكاء الاصطناعي…',
    enter_hint: 'Enter للإرسال · Shift+Enter لسطر جديد',
    send: 'إرسال',
    ai_tutor_label: 'المساعد الذكي',
    node_count: (n: number) => `+${n} ${n === 1 ? 'عقدة' : 'عقد'}`,
    note_count: (n: number) => `+${n} ${n === 1 ? 'ملاحظة' : 'ملاحظات'}`,

    categories: {
      foundations: 'الأسس',
      vision: 'الرؤية',
      language: 'اللغة',
      rl: 'التعزيز',
      architecture: 'البنية',
      other: 'أخرى',
    },

    open_notebook: '← افتح الدفتر',
    open_notebook_long: '← افتح دفترك',
    how_it_works_link: '↑ كيف يعمل',
    hero_ornament: '❧',
    hero_headline_main: 'تاريخ الذكاء الاصطناعي،',
    hero_headline_em: 'مُرسَّخ وأنت تتعلمه.',
    hero_body:
      'تحدث مع مُعلِّم ذكاء اصطناعي متخصص. كل مفهوم يتحول إلى عقدة دائمة على جدولك الزمني الشخصي — دفتر يزداد قيمةً مع كل جلسة.',
    how_it_works_label: 'كيف يعمل',
    hiw_title: 'ثلاث خطوات. دفتر واحد ينمو.',
    step1_num: '٠١', step1_title: 'اسأل',
    step1_body:
      'تحدث عن أي ورقة بحثية أو باحث أو مفهوم. يُجيب المعلم بسياق أكاديمي — ليس نتيجة بحث، بل شرح مدروس.',
    step2_num: '٠٢', step2_title: 'خرِّط',
    step2_body:
      'تُوضع كل فكرة تناقشها على جدول زمني تفاعلي. تربط الحواف المفاهيم التي تسبق أو تُمكِّن أو أوحت ببعضها.',
    step3_num: '٠٣', step3_title: 'عُد',
    step3_body:
      'يبقى دفترك محفوظاً عبر كل جلسة. كلما استكشفت أكثر، ازدادت الخريطة ثراءً — تاريخ شخصي للذكاء الاصطناعي بنيته بنفسك.',
    footer_cta_title: 'دفترك ينتظرك.',
    footer_cta_body: 'ابدأ بسؤال عن البيرسبترون أو المحوِّل أو أي شيء بينهما.',
    open_ai_mind: '← افتح AI Mind',

    sandbox_chat_head: 'المساعد المعرفي',
    sandbox_user_label: 'أنت',
    sandbox_tutor_label: 'المعلم',
    sandbox_cta: '← افتح دفترك',
    sandbox_nudge: '← ابدأ جدولك الزمني الخاص',
    sandbox_beat1_user: 'أخبرني عن بيرسبترون روزنبلات',
    sandbox_beat2_tutor:
      'كان بيرسبترون روزنبلات عام ١٩٥٨ أول شبكة عصبية قابلة للتدريب. نشأ من ورشة دارتموث ١٩٥٦ — التجمع الذي صكّ مصطلح «الذكاء الاصطناعي».',
    sandbox_beat3_user: 'ما النظرية التي أثبتت أنه يعمل؟',
    sandbox_beat4_tutor:
      'أثبتت نظرية التقارب عام ١٩٦٢ أن البيرسبترون يجد دائماً حلاً إذا وُجد — أول ضمان رياضي على أن الآلة يمكنها التعلم.',

    founding_label: 'الأعضاء المؤسسون',
    founding_title_plain: 'مجاني في مرحلة التجربة.',
    founding_title_em: '٧ دولارات شهرياً مدى الحياة',
    founding_title_suffix: 'لأول ٢٠٠ عضو.',
    tier_free_name: 'مجاني', tier_free_price: '$0', tier_free_blurb: 'جرّب الدفتر',
    tier_free_points: ['دفتر واحد', '٣٠ دورة تعليمية / شهر', 'لوحة كاملة'],
    tier_scholar_name: 'باحث', tier_scholar_price: '$12', tier_scholar_blurb: 'المنتج كاملاً',
    tier_scholar_points: ['عقد غير محدودة', '٥٠٠ دورة تعليمية / شهر', 'تصدير · مراجعة متباعدة'],
    tier_patron_name: 'راعٍ', tier_patron_price: '$24', tier_patron_blurb: 'للمستخدمين المتقدمين',
    tier_patron_points: ['كل شيء غير محدود', 'نموذج ذو أولوية', 'ميزات مبكرة'],
    email_placeholder: 'بريدك@مثال.com',
    reserve_btn: '← احجز مكانك',
    reserving: 'جارٍ الحجز…',
    founding_done: 'أنت في القائمة. سنرسل إليك دعوة العضو المؤسس قريباً.',
    founding_error: 'يرجى إدخال بريد إلكتروني صالح والمحاولة مرة أخرى.',
    founding_fineprint: 'لا رسوم الآن. لن نرسل إليك إلا حين تصبح دعوتك جاهزة.',
  },
} as const

export type Strings = typeof STRINGS['en']

// ── Context ────────────────────────────────────────────────────────────────────

interface LocaleCtx {
  locale: Locale
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleCtx>({ locale: 'en', setLocale: () => {} })

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, _setLocale] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'ar' || saved === 'en') _setLocale(saved)
  }, [])

  function setLocale(l: Locale) {
    _setLocale(l)
    localStorage.setItem(LOCALE_KEY, l)
    document.documentElement.lang = l
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
  }

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  return createElement(LocaleContext.Provider, { value: { locale, setLocale } }, children)
}

export function useLocale() {
  const { locale, setLocale } = useContext(LocaleContext)
  return {
    locale,
    setLocale,
    t: STRINGS[locale] as Strings,
    dir: (locale === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    isRTL: locale === 'ar',
  }
}
