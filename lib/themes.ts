export interface Theme {
  name: string;
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderSubtle: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  accent: string;
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
}

export const themes = {

  // ── Light ────────────────────────────────────────────────────────────────

  parchment: {
    name: "Parchment",
    bg: "#f0ebe3",
    surface: "#e8e2d9",
    surfaceRaised: "#ede8e0",
    border: "#d4cdc2",
    borderSubtle: "#e0dbd2",
    text: {
      primary: "#1a1714",
      secondary: "#5c5650",
      muted: "#9a948e",
    },
    accent: "#b07d4a",
    fonts: {
      display: "'Cormorant', serif",
      body: "'DM Sans', sans-serif",
      mono: "var(--font-geist-mono)",
    },
  } satisfies Theme,

  bone: {
    name: "Bone",
    bg: "rgb(216, 211, 202)",
    surface: "#cdc8bf",
    surfaceRaised: "#d4cfc6",
    border: "#b5b0a7",
    borderSubtle: "#c8c3ba",
    text: {
      primary: "#1c1b19",
      secondary: "#5a5650",
      muted: "#968e84",
    },
    accent: "#7a6248",
    fonts: {
      display: "'Cormorant', serif",
      body: "'DM Sans', sans-serif",
      mono: "var(--font-geist-mono)",
    },
  } satisfies Theme,

  linen: {
    name: "Linen",
    bg: "#f5f0e8",
    surface: "#ede8de",
    surfaceRaised: "#f0ebe1",
    border: "#ddd8cc",
    borderSubtle: "#e8e3d8",
    text: {
      primary: "#1e1c18",
      secondary: "#6b6560",
      muted: "#a09890",
    },
    accent: "#c07c40",
    fonts: {
      display: "'Playfair Display', serif",
      body: "'Karla', sans-serif",
      mono: "var(--font-geist-mono)",
    },
  } satisfies Theme,

  // ── Dark ─────────────────────────────────────────────────────────────────

  noir: {
    name: "Noir",
    bg: "#0a0a0a",
    surface: "#141414",
    surfaceRaised: "#1c1c1c",
    border: "#2a2a2a",
    borderSubtle: "#1f1f1f",
    text: {
      primary: "#e8e4df",
      secondary: "#8a8480",
      muted: "#4a4844",
    },
    accent: "#d4a574",
    fonts: {
      display: "'DM Serif Display', serif",
      body: "'DM Sans', sans-serif",
      mono: "var(--font-geist-mono)",
    },
  } satisfies Theme,

  studio: {
    name: "Studio",
    bg: "#1F1E1C",
    surface: "#252422",
    surfaceRaised: "#2c2a28",
    border: "#2a2a3a",
    borderSubtle: "#252530",
    text: {
      primary: "#e0ddd8",
      secondary: "#8a8880",
      muted: "#505048",
    },
    accent: "#8899dd",
    fonts: {
      display: "'Space Grotesk', sans-serif",
      body: "'IBM Plex Sans', sans-serif",
      mono: "var(--font-geist-mono)",
    },
  } satisfies Theme,

  dusk: {
    name: "Dusk",
    bg: "#141218",
    surface: "#1e1b22",
    surfaceRaised: "#252230",
    border: "#2d2838",
    borderSubtle: "#221f2c",
    text: {
      primary: "#e4dff0",
      secondary: "#8a8498",
      muted: "#504c5c",
    },
    accent: "#b89fd4",
    fonts: {
      display: "'Cormorant', serif",
      body: "'DM Sans', sans-serif",
      mono: "var(--font-geist-mono)",
    },
  } satisfies Theme,

  slate: {
    name: "Slate",
    bg: "#141618",
    surface: "#1c1f22",
    surfaceRaised: "#23272c",
    border: "#2a2f36",
    borderSubtle: "#20242a",
    text: {
      primary: "#dde2e8",
      secondary: "#848c96",
      muted: "#484f58",
    },
    accent: "#7eb8a4",
    fonts: {
      display: "'Manrope', sans-serif",
      body: "'Inter', sans-serif",
      mono: "var(--font-geist-mono)",
    },
  } satisfies Theme,

} as const;

export type ThemeName = keyof typeof themes;

// ── Change this to switch the active theme across all labs ─────────────────
export const currentTheme: Theme = themes.linen;
