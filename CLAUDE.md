# CLAUDE.md

Standing instructions for any AI agent (Claude Code, Cursor, etc.) building components, prototypes, or design lab pieces for Colton Tollett.

This file is the source of truth. When it conflicts with general design instincts or trendy defaults, this file wins.

---

## Project Context

This is the design lab and component repo for **Colton Tollett**, a designer/developer working at the intersection of refined UI, motion, and interaction — with a signature interest in audio, generative, and mathematical interfaces. Featured in MusicRadar.

The work here is primarily **R&D for Twitter/portfolio posts** — small, polished, distinctive components and effects. Each piece is a public-facing work sample, not a hidden utility. Treat every file like it might end up in a 10-second demo video.

---

## Identity at a Glance

- **Voice:** Refined, considered, archival. Editorial sensibility meets web craft.
- **Reference points:** Braun (Dieter Rams), Olivetti, ECM Records sleeves, vintage synthesizers, Karel Martens, Müller-Brockmann grids, modular synth interfaces.
- **Avoid:** Generic SaaS aesthetic, AI gradient slop, glassmorphism, bento grids, neon cyberpunk, default Tailwind blues/purples, "vibrant" color schemes.

If a design decision could plausibly appear on either Stripe's marketing site or a vintage synthesizer manual, choose the synth manual.

---

## Visual System

### Colors

Use these exact tokens. Define them in CSS variables, Tailwind config, or your styling layer of choice. Do not introduce new colors without a clear reason.

```
--cream:          #F4EFE6  /* primary background */
--cream-light:    #FAF6EE  /* surface, raised */
--cream-darker:   #EBE4D6  /* depressed, borders */
--ink:            #1A1714  /* primary text */
--ink-soft:       #3A3530  /* body text */
--ink-muted:      #6B6359  /* metadata, captions */
--line:           #D4CCBD  /* dividers, borders */
--line-soft:      #E2DBCC  /* subtle dividers */

/* accents — use sparingly, one accent per composition */
--accent-rust:    #B54A2A
--accent-sage:    #6B7A5A
--accent-ochre:   #C9923B
--accent-slate:   #3A5573
```

**Background rule:** cream for daylight UI work, near-black (`#1A1714` or darker) for synth/audio/instrument pieces. Don't drift between them randomly within a single composition.

### Typography

A two-typeface system. Don't add a third.

```
--serif: 'Fraunces', Georgia, serif       /* display, titles, italic emphasis */
--sans:  'Inter', -apple-system, sans     /* body, UI, captions */
--mono:  'JetBrains Mono', monospace      /* metadata, labels, technical readouts */
```

**Usage rules:**
- **Serif (Fraunces)** — display sizes, titles, anything that wants editorial weight. Often italic. Weights 300–500. Letter-spacing tight (`-0.02em` to `-0.025em` at large sizes).
- **Sans (Inter)** — body text, button labels, anything that needs to be readable at small sizes. Weights 400–500. Default line-height 1.5.
- **Mono (JetBrains Mono)** — small caps with wide letter-spacing (`0.15em` to `0.20em`), all uppercase, for metadata: "COMPONENT.2", "STREET ARCHIVE", "DRAG TO DISMISS", "RATE: 24/s". This is the most important typographic signature. Use it liberally for labels.

### Spacing & Layout

- Rounded corners on framed elements: 12–24px radius. No sharp corners on cards/containers.
- Generous whitespace around the subject. The work breathes.
- Borders: 1px solid `--line`, often softened with `--line-soft` inside cards.
- Grids: explicit, sometimes visible (dotted or dashed `--line-soft`). Print/architectural feel.

### Motion

Motion is a primary design material here, not decoration. Treat it that way.

**Rules:**
- Use spring physics where possible, not linear easing. Reach for Motion (`framer-motion` / `motion`) with `spring` transitions: `{ type: 'spring', stiffness: 300, damping: 28 }` as a starting point.
- Effects should be legible in the first 2 seconds. If it takes longer to "see" the idea, it's too slow.
- One technique per composition. Don't pile on.
- Interruptibility matters. If the user changes direction mid-animation, motion should respond, not finish the original arc.
- Avoid: bounce-out at the end of every transition, parallax that doesn't earn its place, scroll-jacking, hover effects that don't have a purpose.

**Preferred motion library:** Motion (formerly Framer Motion). Use `useSpring`, `useMotionValue`, `useTransform` for fine control. Avoid CSS keyframe animations except for the simplest cases.

---

## Code Style

### Stack preferences

- **Framework:** React with TypeScript (preferred), or vanilla TS/JS for tiny demos.
- **Styling:** Tailwind CSS with the tokens above mapped to theme. Or CSS modules with CSS variables. Avoid styled-components and emotion unless there's a specific reason.
- **Motion:** Motion (`motion/react` or `framer-motion`).
- **3D:** Three.js, with `@react-three/fiber` and `@react-three/drei` when in React.
- **Smooth scroll:** Lenis when needed.
- **Audio:** Tone.js or the Web Audio API directly.
- **Math/curves:** d3 or mathjs for parametric work.

### File structure

Each component lives in its own folder with:

```
ComponentName/
├── ComponentName.tsx
├── ComponentName.module.css  (or inline Tailwind)
├── README.md                 (1-paragraph description + the caption template)
└── index.ts
```

### Component code

- TypeScript-first, with explicit prop types.
- Functional components, hooks-based.
- No unnecessary abstractions. A 100-line component is fine if that's what the idea requires.
- Comments only where the *why* isn't obvious from the code. Skip "// set state" comments.
- Default exports for components, named exports for hooks and utilities.

### Performance

- Each demo should hit 60fps on a mid-range laptop. If it doesn't, optimize before considering the piece done.
- WebGL work needs a clean degraded version or "view on desktop" prompt for mobile.
- Avoid layout thrashing during interactions — use `transform` and `opacity`, not `width`/`top`.
- `will-change` only on actively animating elements, removed when idle.

---

## Aesthetic Decisions (the small things that add up)

### Always

- Small caps mono labels for any metadata, readouts, or technical info
- Serif italic for subject names ("Rue de Rivoli", "BBC Micro")
- Rounded corners on framed compositions
- A single accent color per piece, used sparingly
- Tabular numerals (`font-variant-numeric: tabular-nums`) on any number that changes during interaction — readout values, counters, timers
- Spring physics on settle/release
- A signature label in the corner: small caps mono with the component name (e.g., "COMPONENT.2") and a contextual hint ("DRAG TO DISMISS")

### Never

- Default Tailwind blue/purple as an accent color
- Drop shadows that aren't physically motivated
- Emoji in UI (sparingly in captions only)
- Lorem ipsum as placeholder content — use real or believably-real content
- Stock photos
- Generic SaaS hero patterns (big gradient blob, blurred orbs, dot grid behind a hero)
- Animations that don't serve the interaction (decorative wiggles, autoplay loops with no purpose)
- More than 2 typefaces in one composition

---

## Component Naming Convention

Components and demos follow a series naming pattern:

- **Component.X** — UI component studies (buttons, nav, inputs, etc.)
- **Audio.X** — synth, oscilloscope, audio interface work
- **Effect.X** — standalone motion experiments
- **Type.X** — typography, foundries, type-in-motion
- **Study.X** — generative, mathematical, exploratory
- **Archive.X** — vintage tech / archival concept pieces

Each new piece in a series gets the next number. The README should specify the series and number. The component itself should display the series label in the corner using mono small caps.

---

## Reference Implementations

When building a new piece, study these *before* coding (in this order):

1. **Existing demos in this repo** — match the aesthetic of what's already here.
2. **Emil Kowalski's work** — `emilkowal.ski` for motion principles. The Vaul and Sonner source code is the reference for physics-based interactions.
3. **Rauno Freiberg's work** — `rauno.me` for restrained, considered UI.
4. **Bruno Simon, Pawel Gola** — for Three.js / WebGL work.
5. **MusicRadar synth interface archive** — for any audio/synth piece.
6. **Braun product archive, Olivetti archive** — for industrial/UI grammar.

Do not copy. Study the principles, then make something distinctively Colton's.

---

## Captions & Documentation

Every component should have a README with a Twitter-ready caption following this format:

```
[Series.Number] — [Specific descriptive title].

[Optional one-line technical note about what makes it interesting.]

Made with @tool1, @tool2 and @tool3.
```

Good caption examples:
- "Component.2 — Drag-to-dismiss drawer with velocity-based completion. Flick to close, or drag past the threshold. Made with @motiondotdev."
- "Audio.3 — FM operator routing visualization. Click any operator to see its modulation path. Built with @reactjs, @ToneJS."

Bad caption examples (avoid):
- "New project ✨"
- "Some new stuff I've been working on"
- "Slider SVG interactions" (too vague)

---

## When in Doubt

If you're unsure whether a design decision fits, ask these questions in order:

1. **Does it serve the interaction, or is it decoration?** If decoration, remove it.
2. **Does it feel like Braun would have designed it, or like a SaaS landing page?** Aim for Braun.
3. **Would this look at home on Emil Kowalski's, Rauno Freiberg's, or Bruno Simon's site?** If yes, good direction.
4. **If I screenshot this at thumbnail size, can someone tell what's happening?** If no, increase contrast/clarity.
5. **Is the motion earning its place?** If you removed it, would the piece be worse? If no, remove it.

When all else fails: **less, but more considered.** Restraint is the signature.

---

## What Counts as Done

A piece is shippable when:

- [ ] Visual treatment matches the tokens in this file (colors, type, spacing, radius)
- [ ] Motion uses spring physics and is interruptible
- [ ] Component has a series label visible in the corner
- [ ] A 10-second screen recording would clearly demonstrate the interaction
- [ ] README contains the caption template with tool tags
- [ ] Mobile gracefully degrades or shows a "view on desktop" hint if WebGL-heavy
- [ ] No console errors, no jank in dev tools performance tab
- [ ] If I'm proud of it as the latest post on the feed, ship it. If not, keep refining.

---

## Notes for the Agent

- This file overrides any general "modern web design" instincts.
- When generating example content (article text, project names, etc.), match the archival/editorial voice. Reference real designers, real synthesizers, real type foundries, real magazines. No "Lorem ipsum," no "John Doe."
- Prefer fewer, better-considered features over many shallow ones.
- If a request feels off-brand, flag it before building rather than implementing it and asking for revisions later.
- Don't add bells and whistles unless asked. Restraint > completeness.
