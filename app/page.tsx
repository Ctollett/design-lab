import Link from "next/link";

const demos = [
  {
    slug: "3d-carousel",
    title: "3D Carousel",
    description: "Images arranged in a 3D circle — drag to rotate, depth visible",
    isRoot: true,
  },
  {
    slug: "parallax-lens",
    title: "Parallax Lens",
    description: "Architectural parallax with refracted glass image cards",
    isRoot: true,
  },
  {
    slug: "velocity-stepper",
    title: "Velocity Stepper",
    description: "Click and drag to scrub a value — drag speed controls increment size",
    isRoot: true,
  },
  {
    slug: "card-shelf",
    title: "Card Shelf",
    description: "Portrait cards scrolling horizontally at the bottom of the screen",
    isRoot: true,
  },
  {
    slug: "font-flare",
    title: "Font Flare",
    description: "Font lens flare color frequency experiment",
    isRoot: true,
  },
  {
    slug: "single-card-image-focus",
    title: "Single Card Image Focus",
    description: "Single card with image focus interaction",
    isRoot: true,
  },
  {
    slug: "inline-auto-suggest",
    title: "Inline Auto-Suggest",
    description: "Text selection with ghost text rewrite suggestions",
    isRoot: true,
  },
  {
    slug: "ruun-showcase",
    title: "Ruun Showcase",
    description: "Spring physics SVG morphing across four real-world components",
    isRoot: true,
  },
  {
    slug: "dropdown-menu",
    title: "Dropdown Menu",
    description: "Polished action menu with spring hover states",
    isRoot: true,
  },
  {
    slug: "live-polish",
    title: "Live Polish",
    description: "Experiment canvas for the live polish tool",
    isRoot: true,
  },
  {
    slug: "command-menu",
    title: "Command Menu",
    description: "Search command palette with morph transition and spring highlight",
    isRoot: true,
  },
  {
    slug: "image-filter",
    title: "Image Filter",
    description: "Adjust button that expands into a filter panel with spring sliders",
    isRoot: true,
  },
  {
    slug: "pull-up-footer",
    title: "Pull-Up Footer",
    description: "Card page that reveals a large fixed footer as you scroll",
    isRoot: true,
  },
  {
    slug: "example",
    title: "Example Demo",
    description: "GSAP + Framer Motion showcase",
  },
  {
    slug: "test",
    title: "Test Demo",
    description: "My first demo",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black p-8 md:p-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-16">
          <h1 className="mb-4 text-4xl font-semibold text-white">
            Design Lab
          </h1>
          <p className="text-lg text-zinc-400">
            Interaction design experiments and demos
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {demos.map((demo) => (
            <Link
              key={demo.slug}
              href={demo.isRoot ? `/${demo.slug}` : `/demos/${demo.slug}`}
              className="group rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <h2 className="mb-2 text-xl font-medium text-white group-hover:text-zinc-100">
                {demo.title}
              </h2>
              <p className="text-sm text-zinc-400">{demo.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-sm text-zinc-500">
          <p>Add new demos in /app/demos/[slug]/page.tsx</p>
        </div>
      </div>
    </div>
  );
}
