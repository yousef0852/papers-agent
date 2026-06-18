# AI Mind — Launch Kit (Validation Sprint)

Everything you need to put AI Mind in front of strangers and get a real demand signal. Tone rule for every asset below: **intellectual restraint, no hype, no emoji.** Your audience (and especially Hacker News) rewards honesty and punishes marketing voice. Let the artifact do the selling.

Voice = the product: scholar's notebook, calm, precise, a little old-world.

---

## 0. Pre-launch checklist (do these first)

- [ ] App is live on a public URL (`docs/DEPLOY.md`)
- [ ] PostHog key set in Vercel; events confirmed firing
- [ ] Founding-member email capture confirmed writing to the `waitlist` table
- [ ] A 45–60s demo video/GIF recorded (script below)
- [ ] A read-only "AI history map" screenshot/clip for the lead magnet
- [ ] You and your co-founder agree who posts where and who replies to comments

---

## 1. Demo video script (45–60s)

This single asset powers everything — the X thread, Show HN, and the lead magnet. Screen recording, no face needed. Keep it real-time; do not speed up the graph.

| Time | On screen | Caption / voiceover (optional) |
|---|---|---|
| 0:00–0:05 | Landing page hero, then click "Open notebook" | "This is a notebook for remembering what you read about AI history." |
| 0:05–0:15 | The seed timeline (Perceptron → Transformer). Hover one edge so a relationship label shows. | "It starts as a map of landmark papers, connected by how they actually relate." |
| 0:15–0:35 | Open the tutor. Type a real question, e.g. *"How did attention lead to the Transformer?"* Let the reply stream and watch a new node + edge + a marginal note appear. | "Ask the tutor anything. Every answer adds to your map — papers, concepts, and short notes on what you cared about." |
| 0:35–0:50 | Click the new node, show the inspector + marginalia. Pan around the growing graph. | "It's not the textbook's structure. It's yours — and it grows every session." |
| 0:50–0:60 | Cut to the founding-member section. | "Free in beta. Link below." |

Tips: record at 1280×720+, trim dead air, end on the URL. Export both an MP4 (for X/Show HN comment) and a looping GIF (for Reddit/embeds).

---

## 2. X / Twitter — build-in-public launch thread

Post the demo video on tweet 1 (video gets the most reach). Keep tweets short.

**1/**
We built a notebook for people who read about the history of AI.

You chat with a tutor. Every paper, idea, and connection you discuss becomes a node on your own timeline — a map that grows the more you read.

Here's 60 seconds of it:
[attach demo video]

**2/**
The problem we kept hitting: you read a dozen papers, have a dozen ChatGPT threads, take scattered notes — and three months later you can't reconstruct how it all connects in your head.

The facts survive. Your *map* doesn't.

**3/**
So the graph is the memory, not the chat.

Ask "how did attention lead to the Transformer?" and you don't just get an answer — you get Bahdanau → Transformer drawn on your timeline, with a margin note on what you asked about.

**4/**
We deliberately made it feel like a scholar's notebook, not another AI app. Parchment, serif type, hand-drawn warmth. No purple gradients. The sameness is the point.

**5/**
It's two of us, both engineers. Next.js + FastAPI + Claude. We're putting it out early because we want to know one thing: do people come back to their notebook a second time.

**6/**
It's free during the beta. First 200 people get founding-member pricing for life.

If you read AI papers and want a place to remember what you learned: [URL]

Tell us what's wrong with it — that's the whole reason it's public.

**Build-in-public follow-up posts (space out over the sprint):**
- "Day 1: X people opened a notebook, Y sent a message to the tutor. Here's what they asked first." (screenshot of anonymized first questions)
- "Someone's notebook after one session vs. the seed. [before/after screenshot]"
- "The hardest design decision: should the AI invent a node it isn't 100% sure about? Here's where we landed." (engages the trust crowd)

---

## 3. Hacker News — Show HN

Post Tue–Thu, ~8–10am ET. One founder posts; both watch the thread and reply fast, plainly, and non-defensively for the first 2–3 hours.

**Title:**
`Show HN: AI Mind – Chat with a tutor and build your own map of AI history`

**Body:**
> Hi HN. We're two engineers. AI Mind is a notebook for learning the history of AI: you talk to a tutor about papers and concepts, and every exchange adds nodes and typed relationships to a personal timeline graph. The idea is that the graph becomes your memory — after a few months it reflects what you actually got curious about, not a fixed syllabus.
>
> Why we built it: we kept accumulating AI-history knowledge across PDFs, browser tabs, and one-off chat threads, and none of it captured how we personally connected the ideas. Notes are linear; understanding isn't.
>
> How it works: chat sets focus on a paper or topic, the tutor proposes papers/concepts/edges (extends, enables, inspired_by, etc.), and side discussions become short marginal notes on the relevant node. It persists across sessions.
>
> Stack: Next.js front end, FastAPI back end, Claude for the tutor, Postgres. The canvas is hand-rolled SVG.
>
> Honest about the state: it's an early MVP. Today the tutor relies on the model's own knowledge (no retrieval yet), so it can occasionally be wrong about a year or an author — we'd love to hear where it breaks. There's no auth yet; your notebook lives in your browser, and there's an export button so you don't lose it.
>
> It's free during the beta. We're mostly trying to learn whether people come back to a notebook like this a second time. Try it and tell us what's missing: [URL]

Reply-readiness notes:
- Expect "isn't this just ChatGPT + a mind map?" — answer: the value is accumulation + structure + provenance over months, not a single answer. Be concrete.
- Expect hallucination skepticism — agree, explain the retrieval/provenance roadmap, don't overpromise.
- Have the demo video link ready to drop in a comment.

---

## 4. Reddit

Post natively (no link-only). Communities: r/MachineLearning (use the [P]/showcase convention), r/learnmachinelearning (best fit — self-taught learners), r/artificial.

**Title:** `[P] I built a notebook that turns reading AI history papers into a personal map`

**Body (short, then the GIF):**
> I read a lot of AI history and could never reconstruct how the ideas connected in my head months later. So I built a notebook where you chat with a tutor and every paper/concept/connection you discuss gets drawn on your own timeline. It persists and grows across sessions.
>
> It's free in beta, two-person project, genuinely want feedback on whether it's useful or just a toy. [GIF] Link in comments.

(Put the link in the first comment; some subs rank self-posts higher than link posts.)

---

## 5. Lead magnet — "The history of AI as one map"

Your highest-leverage organic asset, because it *is* the product's output and it's inherently shareable.

**What it is:** a clean, read-only render (or annotated screenshot/short clip) of the seed graph — the chain from McCulloch-Pitts (1943) through the Perceptron, backprop, CNNs, LSTMs, word2vec, seq2seq, attention, the Transformer, to BERT/GPT — with the typed edges visible.

**How to use it:**
- Post it standalone: *"I mapped the history of modern AI as one connected timeline — every arrow is a real relationship (extends / enabled / inspired). Built it into a tool you can grow yourself."* → link.
- It ranks and gets saved/shared for the diagram alone, then funnels the curious into opening their own notebook.
- Repurpose: a tall image for Reddit/LinkedIn, a horizontal clip for X, a pinned tweet.

**Optional upgrade (later):** a genuinely public, read-only `/map` page. Public shareable graphs are on your roadmap (Phase 4) but a single curated read-only map is a cheap, powerful acquisition surface worth pulling forward if the lead magnet performs.

---

## 6. Distribution sequence (suggested order over ~1–2 weeks)

1. Soft-launch to your personal network + the 5 named first users. Fix anything embarrassing.
2. Post the X build-in-public thread.
3. Post the lead-magnet map (X + one subreddit).
4. Once the loop is polished and you've watched ~5 people use it: Show HN.
5. After Show HN traction, email 1–2 newsletter curators (Latent Space, AlphaSignal) with the demo + early numbers.
6. Run the Sean Ellis PMF survey at ~2 weeks of usage.

Hold paid ads until after this tells you whether people *return*. Paid traffic on an unvalidated loop just buys you noise.
