"use client";

import { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./marginalia.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type Citation = {
  id: number;
  color: string;
  source: {
    title: string;
    author: string;
    year: string;
    publisher: string;
    cover: string;
    quote: string;
  };
};

// ── Data ──────────────────────────────────────────────────────────────────────

const CITATIONS: Citation[] = [
  {
    id: 1,
    color: "#E8C040",
    source: {
      title: "An Essay on Typography",
      author: "Eric Gill",
      year: "1931",
      publisher: "Sheed & Ward",
      cover: "/marginalia/essay-on-typography.png",
      quote: "Letters are things, not pictures of things.",
    },
  },
  {
    id: 2,
    color: "#E8705A",
    source: {
      title: "The Americans",
      author: "Robert Frank",
      year: "1958",
      publisher: "Grove Press",
      cover: "/marginalia/the-americans.png",
      quote: "There is one thing the photograph must contain, the humanity of the moment.",
    },
  },
  {
    id: 3,
    color: "#5A90D8",
    source: {
      title: "Typographie",
      author: "Emil Ruder",
      year: "1967",
      publisher: "Niggli",
      cover: "/marginalia/typographie.png",
      quote: "The whole object of typography is to communicate.",
    },
  },
  {
    id: 4,
    color: "#E860A8",
    source: {
      title: "Camera Lucida",
      author: "Roland Barthes",
      year: "1980",
      publisher: "Hill and Wang",
      cover: "/marginalia/camera-lucida.png",
      quote: "Photography is a certificate of presence.",
    },
  },
  {
    id: 5,
    color: "#E88030",
    source: {
      title: "Vision in Motion",
      author: "László Moholy-Nagy",
      year: "1947",
      publisher: "Paul Theobald",
      cover: "/marginalia/vision-in-motion.png",
      quote: "Vision in motion is simultaneous grasp.",
    },
  },
  {
    id: 6,
    color: "#3AB898",
    source: {
      title: "William Eggleston's Guide",
      author: "William Eggleston",
      year: "1976",
      publisher: "MoMA",
      cover: "/marginalia/william-eggleson's-guide.png",
      quote: "I am at war with the obvious.",
    },
  },
  {
    id: 7,
    color: "#9868D8",
    source: {
      title: "Pioneers of Modern Typography",
      author: "Herbert Spencer",
      year: "1969",
      publisher: "Lund Humphries",
      cover: "/marginalia/pioneers-of-modern-typography.png",
      quote: "Typography's revolution was as much ideological as formal.",
    },
  },
  {
    id: 8,
    color: "#70C040",
    source: {
      title: "A Smile in the Mind",
      author: "Beryl McAlhone & David Stuart",
      year: "1996",
      publisher: "Phaidon",
      cover: "/marginalia/a-smile-in-the-mind.png",
      quote: "The best ideas have a quality of inevitability.",
    },
  },
];

const BODY: (string | { cite: number })[][] = [
  [
    "Letters are not neutral carriers. Gill understood this when he argued that a letter is a thing made by human hands, shaped by specific pressures and tools, carrying the residue of its own making. The typeface you choose is not cosmetic. It is a stance.",
    { cite: 1 },
  ],
  [
    "Robert Frank drove across America with a Leica and returned with a record of something that had no official image. The social texture of postwar life: the jukebox, the diner, the covered car, the Black waiter and the white politician. The camera did not explain. It witnessed.",
    { cite: 2 },
  ],
  [
    "Emil Ruder's treatise on typography began from a position that most designers still find uncomfortable: that type exists to be read, not to be admired. This was not anti-aesthetics. It was the argument that the highest achievement in typography is invisibility — a text that moves the reader forward without once making them aware of the vehicle.",
    { cite: 3 },
  ],
  [
    "The relationship between image and text is the oldest problem in visual communication, and it has never been resolved, only renegotiated. At different moments in design history, one has dominated the other. Swiss modernism elevated text to structural principle. Photography eventually returned the image to its rightful position as something that cannot be replaced by description.",
  ],
  [
    "Barthes wrote about photographs in terms of what they do to the viewer rather than what they depict. The punctum — the detail that catches you without your consent — became the operative term for a generation of image-makers. A photograph could be technically accomplished and still inert. The punctum was not something the photographer chose. It was what slipped through.",
    { cite: 4 },
  ],
  [
    "To look at design history without looking at photography is to misread both. The decisive shift in twentieth-century visual culture was not purely typographic. It was photographic. The camera made the world available as material. Everything became recomposable: space, time, the human face.",
  ],
  [
    "Moholy-Nagy saw no distinction between design, painting, and photography. For him they were all the same act: organising visual information in space and time. His students at the New Bauhaus in Chicago were taught to look before they were taught to make. The eye, he believed, was an instrument that could be trained to perceive what the untrained eye moved past without stopping.",
    { cite: 5 },
  ],
  [
    "This is the tension that underlies all serious design education: the difference between training the hand and training the eye. Most curricula address the hand. The eye is harder to teach because it requires exposure rather than instruction. You train the eye by looking at things that reward looking, repeatedly, over a long time.",
  ],
  [
    "Eggleston photographed the ordinary. A supermarket trolley. A light bulb. A tiled bathroom floor. What made the work extraordinary was not the subject but the gravity he assigned to it — the sense that this specific thing, under this specific light, at this specific moment, was the only thing worth looking at.",
    { cite: 6 },
  ],
  [
    "Colour in photography went through the same prejudices as colour in graphic design. It was considered vulgar for years. Black and white was serious; colour was commercial. What Eggleston and Shore understood was that colour is not decoration applied to a scene. It is the scene. The hue of a wall, the temperature of afternoon light: these were not incidentals.",
  ],
  [
    "Spencer's survey of modernist typography was one of the first serious attempts to write the history of a discipline from inside it. He understood that typography's revolution had been as much ideological as formal — that the shift from centred to asymmetric composition carried a political argument about order, reason, and the relationship between the designed object and its reader.",
    { cite: 7 },
  ],
  [
    "The word that keeps returning across this literature is clarity. Not simplicity. Simplicity is an aesthetic preference. Clarity is an obligation. It demands that you understand what you are communicating before you decide how to communicate it. It demands that the form serves the content so completely that the two become indistinguishable.",
  ],
  [
    "The wit tradition in British graphic design resisted the Swiss argument without rejecting it. The best work in this lineage understood that precision and humour are not opposites. A well-made visual joke requires exactly the same rigour as a well-made grid. The idea must be inevitable. Nothing can be extraneous.",
    { cite: 8 },
  ],
  [
    "What we are left with, reading across this tradition, is not a set of rules but a set of questions. What is the work for? Who is it for? What is the least it needs to be? And then, harder: does it earn its place in the world? Does it add something that was not there before, or does it merely add to the noise? These questions have no permanent answers. The asking of them is what distinguishes design from decoration.",
  ],
];

// ── Constants ─────────────────────────────────────────────────────────────────

// ── Citation Card ─────────────────────────────────────────────────────────────────

type CitationCardProps = {
  source: Citation["source"];
  id: number;
};

function CitationCard({ source, id }: CitationCardProps) {
  return (
    <div className={styles.card}>

      <div className={styles.dots}>
        {CITATIONS.map(c => (
          <div
            key={c.id}
            className={styles.dot}
            style={{
              background: c.color,
              opacity: c.id === id ? 1 : 0.2,
              transform: c.id === id ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>

      <div className={styles.cardTop}>
        <div className={styles.coverWrapper}>
          <img src={source.cover} alt={source.title} className={styles.cover} />
        </div>
        <div className={styles.quote}>&ldquo;{source.quote}&rdquo;</div>
      </div>

      <div className={styles.divider} />

      <div className={styles.cardMeta}>
        {[
          ["Title", source.title],
          ["Author", source.author],
          ["Year", source.year],
          ["Pub.", source.publisher],
        ].map(([label, value]) => (
          <div key={label} className={styles.metaRow}>
            <span className={styles.metaLabel}>{label}</span>
            <span className={styles.metaValue}>{value}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Marginalia() {
  const [collected, setCollected] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);
  const citeRefs = useRef<Record<number, HTMLElement | null>>({});
  const flipDirectionRef = useRef(0);
  const frontId = collected[collected.length - 1];

  const handleFlip = () => {
    setCollected(prev => {
      if (prev.length < 2) return prev;
      const front = prev[prev.length - 1];
      return [front, ...prev.slice(0, -1)];
    });
  };

  useEffect(() => {
    const lenis = new Lenis();
    lenisRef.current = lenis;
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    if (!frontId || !lenisRef.current) return;
    const target = citeRefs.current[frontId];
    if (!target) return;
    const offset = -(window.innerHeight - 460);
    lenisRef.current.scrollTo(target, { offset, duration: 1.4 });
  }, [frontId]);

  const handleDismiss = () => setIsOpen(false);

  const handleCiteClick = (id: number) => {
    if (collected.includes(id)) {
      setCollected(prev => [...prev.filter(c => c !== id), id]);
    } else {
      setCollected(prev => [...prev, id]);
    }
    setIsOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EC" }}>

      <div className={styles.body}>
        {BODY.map((paragraph, i) => {
          const paragraphCite = paragraph.find((s): s is { cite: number } => typeof s !== "string");
          const paragraphColor = paragraphCite ? CITATIONS.find(c => c.id === paragraphCite.cite)?.color : undefined;
          const paragraphActive = paragraphCite?.cite === frontId && isOpen;
          const paragraphDimmed = isOpen && frontId !== undefined && !paragraphActive;
          return (
            <p key={i} style={{ filter: paragraphDimmed ? "blur(1.5px)" : "none", opacity: paragraphDimmed ? 0.4 : 1, transition: "filter 0.4s ease, opacity 0.4s ease" }}>
              <span style={{
                background: paragraphActive && paragraphColor ? `${paragraphColor}55` : "transparent",
                padding: "2px 4px",
                borderRadius: 3,
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
                transition: "background 0.4s ease",
              }}>
                {paragraph.map((segment, j) => {
                  if (typeof segment === "string") return <span key={j}>{segment}</span>;
                  return (
                    <span
                      key={j}
                      ref={el => { citeRefs.current[segment.cite] = el; }}
                      className={styles.cite}
                      onClick={() => handleCiteClick(segment.cite)}
                    >
                      {segment.cite}
                    </span>
                  );
                })}
              </span>
            </p>
          );
        })}
      </div>
      <AnimatePresence>
        {isOpen && collected.length > 0 && (
          <motion.div
            className={styles.stack}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <AnimatePresence mode="popLayout">
              {collected.map((id, index) => {
                const offset = collected.length - 1 - index;
                const isFront = offset === 0;
                const citation = CITATIONS.find(c => c.id === id);
                if (!citation) return null;
                return (
                  <motion.div
                    key={id}
                    style={{ zIndex: collected.length - offset, position: "absolute", bottom: 0, left: 0, right: 0 }}
                    animate={{ y: offset * 10, scale: 1 - offset * 0.03, x: 0 }}
                    exit={{ y: flipDirectionRef.current * 500, opacity: 0, transition: { duration: 0.3 } }}
                    drag={isFront ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.6}
                    onDragEnd={(_, info) => {
                      const flicked = Math.abs(info.velocity.y) > 400;
                      const dragged = Math.abs(info.offset.y) > 80;
                      if (flicked || dragged) {
                        flipDirectionRef.current = info.offset.y > 0 ? 1 : -1;
                        handleFlip();
                      }
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  >
                    <CitationCard source={citation.source} id={citation.id} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.button
            className={styles.dismiss}
            onClick={handleDismiss}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            Close
          </motion.button>
        )}
      </AnimatePresence>
      <div className={styles.cornerLabel}>
        Marginalia<br /><span style={{ opacity: 0.5 }}>Citation Reader</span>
      </div>

    </div>
  );
}
