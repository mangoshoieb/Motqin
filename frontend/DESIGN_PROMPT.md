# Motqin — AI Design Prompt

Paste the block below into your design AI (v0, Lovable, Galileo, Figma AI, Uizard, or just
ChatGPT/Claude for written direction). Trim per §"Tool notes" at the bottom.

---

## THE PROMPT

You are a senior product designer specialising in education and productivity apps. I need **design
directions**, not a single mockup — show me distinct ways this could look and feel, each with the
reasoning behind it.

### The product

**Motqin** is a study app for Arabic-speaking students (school and university age). It is not a
course marketplace and not a note-taking app — it is a *study companion* that takes a student from
"I have an exam in 3 weeks and no plan" to "I know exactly what to do today, and I did it."

Core loop:
1. Student picks their **subjects** and the **lessons** inside them.
2. They build a **plan** — what to study, which days, how much per day.
3. Each day the **execution board** shows today's tasks; they work through them.
4. **Focus mode** runs a timer for a single task with everything else stripped away.
5. **Quizzes** on each lesson prove retention; wrong answers feed back into the plan.
6. An **AI Teacher** chat answers questions about the lesson they're currently on.
7. **Competitions** let students compete on consistency and quiz scores.

### The users

- Teenagers and young adults, primarily on **mobile**, often studying late at night.
- Motivation is the real problem, not information. They abandon plans they fall behind on.
- They are used to Instagram/TikTok-grade polish and will judge the app in 3 seconds.
- Many are anxious about exams — the interface must reduce pressure, not amplify it.

### Hard constraints

- **Arabic-first, RTL layout.** Arabic is the primary language (Cairo typeface), English secondary.
  Layout mirrors: navigation, icons with direction, progress fills, chevrons, charts. Arabic script
  has taller line-height needs and no uppercase — designs that lean on all-caps or tight tracking
  will break.
- **Light and dark mode, both first-class.** Dark is likely the default for night studying.
- **Must be buildable in Tailwind CSS + shadcn/ui.** Standard spacing scale, standard radii, CSS
  variables for color. No effects that need heavy custom canvas/WebGL work.
- Mobile-first, scaling cleanly to desktop.
- Accessible: 4.5:1 text contrast minimum, visible focus states, touch targets ≥ 44px, never
  color-alone to convey status.

### What I want from you

Give me **three genuinely different design directions.** Not three color variations of the same
layout — three different points of view on what this app *is*. For example (do not just copy these,
propose your own):

- One that feels **calm and focused** — quiet, spacious, low-stimulation, reduces exam anxiety.
- One that feels **motivating and game-like** — streaks, progress, momentum, celebration.
- One that feels **serious and premium** — a professional tool, dense with information, earns trust.

**For each direction, give me:**

1. **A name and a one-sentence thesis** — what feeling it creates and why that suits a student.
2. **Color** — a palette with roles (background, surface, primary, accent, success/warning/error),
   in both light and dark. Explain the accent choice. Note: the current build is near-grayscale with
   a blue glow; tell me whether to commit to that or break from it, and why.
3. **Typography** — Arabic + Latin pairing, a type scale, and how headings differ from body.
4. **Shape & depth language** — corner radius, borders vs shadows vs glows, how elevation reads.
5. **Motion** — 2–3 specific moments worth animating and what they communicate. Not decoration.
6. **How three key screens change under this direction:**
   - **Execution board** (today's tasks — the screen students see most)
   - **Focus mode** (a single task + timer, everything else gone)
   - **Subject/lesson browser** (choosing what to study)
7. **What this direction is bad at** — the honest tradeoff. Every direction sacrifices something.

### Then, separately

- **Progress visualisation ideas** — at least 4 distinct ways to show "you are 60% through your plan
  and on track" that are *not* a plain progress bar. Consider that a student who falls behind must
  not feel punished by this component.
- **Empty and failure states** — what the app shows on day one with no plan, and what it shows when
  a student misses three days in a row. This second one matters more than any other screen: it is
  where users quit.
- **The AI Teacher chat** — how do we make it feel like a patient tutor rather than a generic
  chatbot, given it lives inside a lesson context?

### Avoid

- Generic dashboard-template look — sidebar, three stat cards, a line chart.
- Purple/blue SaaS gradients that could belong to any product.
- Corporate B2B tone. These are teenagers, not enterprise buyers.
- Childish gamification — cartoon mascots, confetti on everything, badge spam.
- Designs that only work in English, or only in light mode.
- Anything that requires an illustration library I'd have to commission.

### Format

For each direction: the thesis first, then the specifics. Include concrete values (hex codes, px/rem
sizes, ms durations) — I need to build this, not admire it. If you can render visuals, render the
execution board for all three directions so I can compare them side by side.

Start with a one-paragraph read on what you think the **core design problem** of this product is,
before proposing anything.

---

## Tool notes

| Tool | Adjust how |
|---|---|
| **v0 / Lovable / Bolt** | These build one thing at a time. Run the prompt three times, once per direction, and replace "three directions" with the single direction you want. Keep the constraints section — it's what stops generic output. |
| **Figma AI / Uizard / Galileo** | Keep everything. Add "output as screens I can edit, using auto-layout." |
| **Midjourney / image models** | Cut everything except the direction thesis, the palette, and one screen description. Add a style suffix: `--ar 9:16 --style raw`. These tools ignore long specs. |
| **ChatGPT / Claude (written direction)** | Use as-is. Best tool for the "what is the core design problem" opener and the honest-tradeoff sections. |

## Reusing this for another project

Swap four things and the rest holds: **the product paragraph + core loop**, **the users**, **the hard
constraints** (language/RTL, stack, platform), and **the three key screens**. The structure — three
opposed directions, each with a stated weakness, plus a separate pass on empty/failure states — is
what produces usable ideas instead of pretty noise, regardless of the product.
