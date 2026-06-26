import { useState, useEffect } from 'react'
import type { Locale } from './i18n'

export interface SuggestionSet {
  theme: string
  title: string
  sub: string
  prompts: [string, string, string]
}

const EN_POOL: SuggestionSet[] = [
  {
    theme: 'memory',
    title: 'The Architecture of Memory',
    sub: 'How machines learned to remember — from fixed lookup tables and Markov chains to attention mechanisms that weigh every past token against every future one.',
    prompts: [
      'How did LSTMs solve the vanishing gradient problem?',
      'What is the difference between memory in RNNs and Transformers?',
      'How did attention replace recurrence as a memory mechanism?',
    ],
  },
  {
    theme: 'language',
    title: 'The Linguistic Turn',
    sub: 'Language proved to be the master key. From rule-based parsers and semantic grammars to models that learned the deep structure of meaning by reading the open web.',
    prompts: [
      'How did Word2Vec change the way machines represent meaning?',
      "What made BERT's bidirectional training so significant?",
      'Trace the line from early chatbots to large language models',
    ],
  },
  {
    theme: 'vision',
    title: 'The Perceptual Revolution',
    sub: 'For decades, teaching a machine to see was considered an unsolved frontier. Then a single training run on ImageNet rewrote the rules of what intelligence could be.',
    prompts: [
      "What made AlexNet's 2012 ImageNet win a turning point?",
      'How did convolutional neural networks mirror the visual cortex?',
      'From edge detection to object recognition — explain the hierarchy',
    ],
  },
  {
    theme: 'rl',
    title: 'The Reward Hypothesis',
    sub: 'All goal-directed behaviour can be framed as maximising a scalar reward signal. One hypothesis. Fifty years of machines learning to play, navigate, and decide.',
    prompts: [
      'How did TD-Gammon prove reinforcement learning could master complex games?',
      'What is the difference between model-based and model-free RL?',
      'How did AlphaGo defeat a world champion without human game data?',
    ],
  },
  {
    theme: 'scale',
    title: 'The Problem of Scale',
    sub: 'Researchers spent decades engineering clever architectures. Then someone asked: what happens if you simply make everything bigger? The answer redefined the field.',
    prompts: [
      'What emergent behaviours appear when language models scale up?',
      'How did the Chinchilla paper change how we think about compute and data?',
      'Explain the scaling laws discovered by Kaplan et al. in 2020',
    ],
  },
  {
    theme: 'alignment',
    title: 'The Alignment Question',
    sub: 'Building a system that does what we want it to do turns out to be one of the hardest problems in engineering. We may have been asking the wrong question all along.',
    prompts: [
      'What is the difference between outer alignment and inner alignment?',
      'How does RLHF train models to follow human preferences?',
      'What did Norbert Wiener warn about autonomous systems in 1960?',
    ],
  },
]

const AR_POOL: SuggestionSet[] = [
  {
    theme: 'memory',
    title: 'بنية الذاكرة',
    sub: 'كيف تعلمت الآلات أن تتذكر — من جداول البحث الثابتة وسلاسل ماركوف إلى آليات الانتباه التي تزن كل رمز سابق مقابل كل رمز مستقبلي.',
    prompts: [
      'كيف حلّت شبكات LSTM مشكلة تلاشي التدرج؟',
      'ما الفرق بين الذاكرة في RNNs والمحوِّلات؟',
      'كيف حلّ الانتباه محلّ التكرار كآلية للذاكرة؟',
    ],
  },
  {
    theme: 'language',
    title: 'المنعطف اللغوي',
    sub: 'اللغة كانت المفتاح الرئيسي. من المحللات القائمة على القواعد إلى النماذج التي تعلمت البنية العميقة للمعنى بقراءة الويب المفتوح.',
    prompts: [
      'كيف غيّر Word2Vec طريقة تمثيل الآلات للمعنى؟',
      'لماذا كان التدريب ثنائي الاتجاه في BERT بالغ الأهمية؟',
      'تتبع الخط من روبوتات المحادثة الأولى إلى النماذج اللغوية الكبيرة',
    ],
  },
  {
    theme: 'vision',
    title: 'ثورة الإدراك البصري',
    sub: 'لعقود، اعتُبر تعليم الآلة الرؤية مشكلةً معقدة. ثم أعادت تجربة تدريب واحدة على ImageNet رسم حدود ما يمكن أن يكون عليه الذكاء.',
    prompts: [
      'ما الذي جعل انتصار AlexNet على ImageNet عام 2012 نقطة تحول؟',
      'كيف عكست الشبكات العصبية التلافيفية القشرة البصرية؟',
      'من اكتشاف الحواف إلى التعرف على الكائنات — اشرح التسلسل الهرمي',
    ],
  },
  {
    theme: 'rl',
    title: 'فرضية المكافأة',
    sub: 'يمكن صياغة كل سلوك موجّه نحو هدف باعتباره تعظيماً لإشارة مكافأة عددية. فرضية واحدة. خمسون عاماً من الآلات تتعلم اللعب والتنقل والقرار.',
    prompts: [
      'كيف أثبت TD-Gammon أن التعلم المعزز يستطيع إتقان الألعاب المعقدة؟',
      'ما الفرق بين التعلم المعزز القائم على النموذج وغير القائم عليه؟',
      'كيف هزم AlphaGo بطلاً عالمياً دون بيانات بشرية للعبة؟',
    ],
  },
  {
    theme: 'scale',
    title: 'مشكلة الحجم',
    sub: 'أمضى الباحثون عقوداً في هندسة بنيات ذكية. ثم سأل أحدهم: ماذا يحدث إذا جعلنا كل شيء أكبر فحسب؟ الجواب أعاد تعريف هذا المجال.',
    prompts: [
      'ما السلوكيات الناشئة التي تظهر عند توسع النماذج اللغوية؟',
      'كيف غيّرت ورقة Chinchilla طريقة تفكيرنا في الحوسبة والبيانات؟',
      'اشرح قوانين التوسع التي اكتشفها كابلان وآخرون عام 2020',
    ],
  },
  {
    theme: 'alignment',
    title: 'سؤال المحاذاة',
    sub: 'بناء نظام يفعل ما نريده منه يتضح أنه من أصعب مشكلات الهندسة. ربما كنا نطرح السؤال الخاطئ طوال الوقت.',
    prompts: [
      'ما الفرق بين محاذاة الهدف الخارجية والداخلية؟',
      'كيف يدرّب RLHF النماذج لاتباع تفضيلات الإنسان؟',
      'بماذا حذّر نوربرت وينر من الأنظمة المستقلة عام 1960؟',
    ],
  },
]

function pickRandom(pool: SuggestionSet[]): SuggestionSet {
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useSuggestions(locale: Locale = 'en', _graphSize?: number): {
  suggestion: SuggestionSet | null
  isLoading: boolean
} {
  const [suggestion, setSuggestion] = useState<SuggestionSet | null>(null)

  useEffect(() => {
    setSuggestion(pickRandom(locale === 'ar' ? AR_POOL : EN_POOL))
  }, [locale])

  return { suggestion, isLoading: suggestion === null }
}
