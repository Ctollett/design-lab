# Design Lab

A design lab environment for building and testing interaction demos with GSAP and Framer Motion.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo gallery.

## Creating a New Demo

1. Create a new folder in `app/demos/[your-demo-name]/`
2. Add a `page.tsx` file
3. Build your interaction
4. Add it to the demo list in `app/page.tsx`

### Example Demo Structure

```tsx
"use client";

import { motion } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function YourDemo() {
  // Your demo code here
  return <div>Your interactive demo</div>;
}
```

## Tech Stack

- **Next.js 15** - App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **GSAP** - Advanced animations and timelines
- **Framer Motion** - React-native animations and gestures

## Libraries Available

### GSAP

```tsx
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

useGSAP(() => {
  gsap.to(".box", { x: 100, duration: 1 });
}, []);
```

### Framer Motion

```tsx
import { motion } from "framer-motion";

<motion.div
  whileHover={{ scale: 1.1 }}
  transition={{ type: "spring" }}
/>
```

## Custom Utilities

### Easing Curves

Pre-configured easing curves in `globals.css`:

- `--ease-spring`: `cubic-bezier(0.16, 1, 0.3, 1)`
- `--ease-smooth`: `cubic-bezier(0.4, 0, 0.2, 1)`

### Utils

`lib/utils.ts` includes a `cn()` utility for conditional classnames.

## Project Structure

```
design-lab/
├── app/
│   ├── page.tsx              # Demo gallery
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── demos/
│       └── example/
│           └── page.tsx      # Individual demo
├── lib/
│   ├── utils.ts              # Utilities
│   └── hooks/                # Custom hooks
└── README.md
```

## Tips

- Keep demos self-contained in their own folders
- Use `"use client"` directive for interactive components
- Dark mode is enabled by default
- All demos are automatically shareable via URL

## Deployment

Deploy to Vercel with one click:

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Adding Demos to Portfolio

Embed demos in your portfolio using iframes:

```tsx
<iframe
  src="https://your-lab.vercel.app/demos/demo-name"
  className="w-full h-[600px]"
/>
```

Or link directly to the demo URL for sharing on Twitter.
