# Design Lab

A collection of small, polished UI and motion experiments, built as standalone R&D pieces rather than a single app.

## Overview

Each folder under `app/` is a self-contained interface or interaction study, exploring the intersection of refined UI, motion, and generative/mathematical interfaces. These are work samples first: distinctive components and effects designed to hold up as a 10-second demo clip, not hidden utilities.

## What's inside

A sample of the experiments in this repo:

- **3d-carousel** / **image-cube** / **card-shelf**: 3D object and card interaction studies
- **dot-grid** / **infinite-canvas** / **parallax-lens**: generative and camera-driven canvas effects
- **font-flare** / **marginalia**: typographic and editorial layout experiments
- **live-polish** / **image-filter**: real-time visual processing
- **ruun-showcase**: demo of [ruun](https://github.com/Ctollett/ruun-svg), a spring-physics SVG morphing library
- **command-menu** / **dropdown-menu** / **velocity-stepper** / **spatial-scrubber** / **card-lift** / **pull-up-footer** / **single-card-image-focus**: interaction and micro-motion studies

## Tech stack

- **Framework**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Motion**: GSAP, Framer Motion, Lenis (smooth scroll)
- **3D / WebGL**: Three.js, React Three Fiber + Drei, curtainsjs, troika-three-text
- **Typography**: opentype.js
- **SVG animation**: [ruun](https://github.com/Ctollett/ruun-svg), a custom spring-physics morphing library
- **AI experiments**: OpenAI API, Hugging Face Transformers

## Development

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run production build
```
