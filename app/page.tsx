import Link from "next/link";

const demos = [
  {
    slug: "inline-auto-suggest",
    title: "Inline Auto-Suggest",
    description: "Text selection with ghost text rewrite suggestions",
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
