import { useState } from 'react'

export interface SuggestionSet {
  theme: string
  title: string
  sub: string
  prompts: [string, string, string]
}

const POOL: SuggestionSet[] = [
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

function pickRandom(): SuggestionSet {
  return POOL[Math.floor(Math.random() * POOL.length)]
}

/**
 * Returns a cohesive suggestion set for the empty chat state.
 *
 * Currently selects randomly from a curated pool on mount (zero network cost).
 * To swap in a live API response, replace the useState initialiser with:
 *
 *   const [suggestion, setSuggestion] = useState<SuggestionSet | null>(null)
 *   const [isLoading, setIsLoading] = useState(true)
 *   useEffect(() => {
 *     fetch(`/api/notebooks/suggestions?nodes=${graphSize ?? 0}`)
 *       .then(r => r.json())
 *       .then(d => { setSuggestion(d); setIsLoading(false) })
 *       .catch(() => { setSuggestion(pickRandom()); setIsLoading(false) })
 *   }, [graphSize])
 *
 * The component contract (SuggestionSet shape) stays identical either way.
 */
export function useSuggestions(_graphSize?: number): {
  suggestion: SuggestionSet
  isLoading: boolean
} {
  // useState(fn) — initialiser runs exactly once, no null flash, no useEffect needed
  const [suggestion] = useState<SuggestionSet>(pickRandom)
  return { suggestion, isLoading: false }
}
