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
    city: string;
    pages: string;
    form: string;
    lang: string;
    cover: string;
    quote: string;
  };
};

// ── Data ──────────────────────────────────────────────────────────────────────

const CITATIONS: Citation[] = [
  {
    id: 1,
    color: "#B89E77",
    source: {
      title: "An Essay on Typography",
      author: "Eric Gill",
      year: "1931",
      publisher: "Sheed & Ward",
      city: "London",
      pages: "134",
      form: "Monograph",
      lang: "English",
      cover: "/marginalia/essay-on-typography.png",
      quote: "Typography is the efficient means to an essentially utilitarian and only accidentally aesthetic end. The book is not a work of art. It is a tool.",
    },
  },
  {
    id: 2,
    color: "#A97467",
    source: {
      title: "The Americans",
      author: "Robert Frank",
      year: "1958",
      publisher: "Grove Press",
      city: "New York",
      pages: "180",
      form: "Photobook",
      lang: "English",
      cover: "/marginalia/the-americans.png",
      quote: "There is one thing the photograph must contain, the humanity of the moment. Realism is not enough — there has to be vision, and the two together can make a good photograph.",
    },
  },
  {
    id: 3,
    color: "#6E8794",
    source: {
      title: "Typographie",
      author: "Emil Ruder",
      year: "1967",
      publisher: "Niggli",
      city: "Zurich",
      pages: "316",
      form: "Manual",
      lang: "DE / FR / EN",
      cover: "/marginalia/typographie.png",
      quote: "Typography has one plain duty: to convey information in writing. A printed work which cannot be read becomes a product without purpose.",
    },
  },
  {
    id: 4,
    color: "#A26E81",
    source: {
      title: "Camera Lucida",
      author: "Roland Barthes",
      year: "1980",
      publisher: "Hill and Wang",
      city: "Paris",
      pages: "119",
      form: "Essay",
      lang: "FR → EN",
      cover: "/marginalia/camera-lucida.png",
      quote: "What the Photograph reproduces to infinity has occurred only once. The Photograph mechanically repeats what could never be repeated existentially — it is a certificate of presence.",
    },
  },
  {
    id: 5,
    color: "#AD7F4B",
    source: {
      title: "Vision in Motion",
      author: "László Moholy-Nagy",
      year: "1947",
      publisher: "Paul Theobald",
      city: "Chicago",
      pages: "371",
      form: "Monograph",
      lang: "English",
      cover: "/marginalia/vision-in-motion.png",
      quote: "Vision in motion is simultaneous grasp — seeing, feeling, and thinking in relationship, not as a series of isolated phenomena. It is the ability to see the whole at once.",
    },
  },
  {
    id: 6,
    color: "#5E8477",
    source: {
      title: "William Eggleston's Guide",
      author: "William Eggleston",
      year: "1976",
      publisher: "MoMA",
      city: "New York",
      pages: "112",
      form: "Catalog",
      lang: "English",
      cover: "/marginalia/william-eggleson's-guide.png",
      quote: "I am at war with the obvious. Any part of the world is as interesting as any other part. I try to photograph the overlooked moment so that it carries its full weight.",
    },
  },
  {
    id: 7,
    color: "#7A6B85",
    source: {
      title: "Pioneers of Modern Typography",
      author: "Herbert Spencer",
      year: "1969",
      publisher: "Lund Humphries",
      city: "London",
      pages: "160",
      form: "Survey",
      lang: "English",
      cover: "/marginalia/pioneers-of-modern-typography.png",
      quote: "The new typography drew its inspiration from the spirit of the age. Its revolution was as much ideological as formal — type was no longer decoration. It was architecture.",
    },
  },
  {
    id: 8,
    color: "#799365",
    source: {
      title: "A Smile in the Mind",
      author: "Beryl McAlhone & David Stuart",
      year: "1996",
      publisher: "Phaidon",
      city: "London",
      pages: "240",
      form: "Survey",
      lang: "English",
      cover: "/marginalia/a-smile-in-the-mind.png",
      quote: "The best ideas have a quality of inevitability — once you see them, you cannot imagine the problem solved any other way. The wit is the argument.",
    },
  },
];

const BODY: (string | { cite: number })[][] = [
  [
    "There is a question that runs beneath most serious writing about visual culture, and it is rarely asked directly: what is the relationship between how something looks and what it means? Not the meaning of a message — that is the territory of semiotics, which has its own literature. The question here is simpler and harder. When you choose a typeface, a photograph, a layout, a margin — what are you choosing? What claim are you making about the world?",
  ],
  [
    "The difficulty is that visual decisions feel intuitive. A typeface feels right or it doesn't. A photograph works or it fails. But this sense of rightness is not neutral. It is the product of a particular formation — a set of influences, educations, and exposures that have shaped what you are able to see. The designer who thinks they are following instinct is often following a tradition they have not yet named.",
  ],
  [
    "Design history is the attempt to name those traditions. It is an act of making visible what has become invisible through familiarity. The grid, the photograph, the printed page: these are technologies, and like all technologies they carry the assumptions of the people who built them. To understand design is to understand what those assumptions were.",
  ],
  [
    "The relationship between image and text is the oldest problem in visual communication, and it has never been resolved, only renegotiated. At different moments in design history, one has dominated the other. Swiss modernism elevated text to structural principle. Photography eventually returned the image to its rightful position as something that cannot be replaced by description.",
  ],
  [
    "The Bauhaus established, for better or worse, the terms on which most subsequent design education has operated. The argument was that design could be taught — that it was not a matter of talent but of method. You could train a person to see proportion, balance, tension. You could teach the eye what the hand should do. Whether this was true was almost beside the point. The argument was productive. It generated institutions, curricula, and eventually a canon.",
  ],
  [
    "That canon was never neutral. It was Central European, male, and modernist. It assumed that simplification was progress, that ornament was dishonesty, that the universal was more important than the local. These were not self-evident propositions. They were arguments made at a specific historical moment, in response to specific historical conditions. The twentieth century treated them as permanent truths.",
  ],
  [
    "To look at design history without looking at photography is to misread both. The decisive shift in twentieth-century visual culture was not purely typographic. It was photographic. The camera made the world available as material. Everything became recomposable: space, time, the human face.",
  ],
  [
    "This is the tension that underlies all serious design education: the difference between training the hand and training the eye. Most curricula address the hand. The eye is harder to teach because it requires exposure rather than instruction. You train the eye by looking at things that reward looking, repeatedly, over a long time.",
  ],
  [
    "Colour in photography went through the same prejudices as colour in graphic design. It was considered vulgar for years. Black and white was serious; colour was commercial. What Eggleston and Shore understood was that colour is not decoration applied to a scene. It is the scene. The hue of a wall, the temperature of afternoon light: these were not incidentals.",
  ],
  [
    "The word that keeps returning across this literature is clarity. Not simplicity. Simplicity is an aesthetic preference. Clarity is an obligation. It demands that you understand what you are communicating before you decide how to communicate it. It demands that the form serves the content so completely that the two become indistinguishable.",
  ],
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
    "Barthes wrote about photographs in terms of what they do to the viewer rather than what they depict. The punctum — the detail that catches you without your consent — became the operative term for a generation of image-makers. A photograph could be technically accomplished and still inert. The punctum was not something the photographer chose. It was what slipped through.",
    { cite: 4 },
  ],
  [
    "Moholy-Nagy saw no distinction between design, painting, and photography. For him they were all the same act: organising visual information in space and time. His students at the New Bauhaus in Chicago were taught to look before they were taught to make. The eye, he believed, was an instrument that could be trained to perceive what the untrained eye moved past without stopping.",
    { cite: 5 },
  ],
  [
    "Eggleston photographed the ordinary. A supermarket trolley. A light bulb. A tiled bathroom floor. What made the work extraordinary was not the subject but the gravity he assigned to it — the sense that this specific thing, under this specific light, at this specific moment, was the only thing worth looking at.",
    { cite: 6 },
  ],
  [
    "Spencer's survey of modernist typography was one of the first serious attempts to write the history of a discipline from inside it. He understood that typography's revolution had been as much ideological as formal — that the shift from centred to asymmetric composition carried a political argument about order, reason, and the relationship between the designed object and its reader.",
    { cite: 7 },
  ],
  [
    "The wit tradition in British graphic design resisted the Swiss argument without rejecting it. The best work in this lineage understood that precision and humour are not opposites. A well-made visual joke requires exactly the same rigour as a well-made grid. The idea must be inevitable. Nothing can be extraneous.",
    { cite: 8 },
  ],
  [
    "What we are left with, reading across this tradition, is not a set of rules but a set of questions. What is the work for? Who is it for? What is the least it needs to be? And then, harder: does it earn its place in the world? Does it add something that was not there before, or does it merely add to the noise? These questions have no permanent answers. The asking of them is what distinguishes design from decoration.",
  ],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function preventOrphan(text: string): React.ReactNode {
  const last = text.lastIndexOf(" ");
  if (last === -1) return text;
  const secondLast = text.lastIndexOf(" ", last - 1);
  if (secondLast === -1) {
    return <>{text.slice(0, last)}{" "}{text.slice(last + 1)}</>;
  }
  return (
    <>
      {text.slice(0, secondLast)}
      {" "}
      {text.slice(secondLast + 1, last)}
      {" "}
      {text.slice(last + 1)}
    </>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

// ── Citation Card ─────────────────────────────────────────────────────────────────


type CitationCardProps = {
  source: Citation["source"];
  color: string;
  count?: number;
  onDismiss?: () => void;
};

function CitationCard({ source, color, count, onDismiss }: CitationCardProps) {
  return (
    <div className={styles.card} style={{ background: color }}>
      {count != null && (
        <div className={styles.cardCount}>{count} / {CITATIONS.length}</div>
      )}
      {onDismiss && (
        <motion.button
          className={styles.tag}
          onClick={onDismiss}
          initial="rest"
          whileHover="hover"
        >
          <motion.div
            className={styles.tagBg}
            style={{ "--tag-color": color, transformOrigin: "bottom center" } as React.CSSProperties}
            variants={{ rest: { scaleY: 1 }, hover: { scaleY: 1.22 } }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          />
          <span className={styles.tagLabel}>Close</span>
        </motion.button>
      )}

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
          ["City", source.city],
          ["Pages", source.pages],
          ["Form", source.form],
          ["Lang.", source.lang],
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
  const [collectedOrder, setCollectedOrder] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

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

  const handleDismiss = () => setDismissing(true);

  const handleCiteClick = (id: number) => {
    if (collected.includes(id)) {
      setCollected(prev => [...prev.filter(c => c !== id), id]);
    } else {
      setCollected(prev => [...prev, id]);
      setCollectedOrder(prev => [...prev, id]);
    }
    setIsOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EC" }}>
      <div className={styles.body}>
        {BODY.map((paragraph, i) => {
          const paragraphCite = paragraph.find((s): s is { cite: number } => typeof s !== "string");
          const paragraphColor = paragraphCite ? CITATIONS.find(c => c.id === paragraphCite.cite)?.color : undefined;
          const paragraphActive = paragraphCite?.cite === frontId && isOpen && !dismissing;
          const paragraphDimmed = isOpen && !dismissing && frontId !== undefined && !paragraphActive;
          const lastStringIdx = paragraph.reduce((acc, seg, k) => typeof seg === "string" ? k : acc, -1);
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
                  if (typeof segment === "string") return <span key={j}>{j === lastStringIdx ? preventOrphan(segment) : segment}</span>;
                  return (
                    <span
                      key={j}
                      ref={el => { citeRefs.current[segment.cite] = el; }}
                      className={styles.cite}
                      style={{ color: CITATIONS.find(c => c.id === segment.cite)?.color }}
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
          <motion.div className={styles.stack}>
            {collected.map((id, index) => {
              const offset = collected.length - 1 - index;
              const isFront = offset === 0;
              const citation = CITATIONS.find(c => c.id === id);
              if (!citation) return null;
              const rotation = Math.sin(id * 2.4) * 1.8;
              const exitDelay = (collected.length - 1 - index) * 0.07;
              return (
                <motion.div
                  key={id}
                  initial={{ y: 700, opacity: 0 }}
                  style={{ zIndex: collected.length - offset, position: "absolute", bottom: 0, left: 0, right: 0, cursor: isFront && !dismissing ? "grab" : "default" }}
                  animate={dismissing
                    ? { y: 700, opacity: 0 }
                    : { y: offset * 10, scale: 1 - offset * 0.03, rotate: isFront ? 0 : rotation, opacity: 1 }
                  }
                  transition={dismissing
                    ? { type: "spring", stiffness: 280, damping: 28, delay: exitDelay }
                    : { type: "spring", stiffness: 300, damping: 26, delay: index * 0.07 }
                  }
                  drag={!dismissing && isFront ? "y" : false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.6}
                  whileDrag={{ cursor: "grabbing" }}
                  onDragEnd={(_, info) => {
                    const flicked = Math.abs(info.velocity.y) > 400;
                    const dragged = Math.abs(info.offset.y) > 80;
                    if (flicked || dragged) {
                      flipDirectionRef.current = info.offset.y > 0 ? 1 : -1;
                      handleFlip();
                    }
                  }}
                  onAnimationComplete={() => {
                    if (dismissing && index === 0) {
                      setIsOpen(false);
                      setDismissing(false);
                    }
                  }}
                >
                  <CitationCard source={citation.source} color={citation.color} count={isFront ? collectedOrder.indexOf(id) + 1 : undefined} onDismiss={isFront ? handleDismiss : undefined} />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      <div className={styles.cornerLabel}>
        Marginalia<br /><span style={{ opacity: 0.5 }}>Citation Reader</span>
      </div>

    </div>
  );
}
