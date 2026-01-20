import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Design Lab",
  description: "Interaction design experiments and demos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alegreya:wght@400;700;900&family=Archivo:wght@100;400;900&family=Arvo:wght@400;700&family=Barlow:wght@100;400;900&family=Bebas+Neue&family=Bitter:wght@100;400;900&family=Cabin:wght@400;700&family=Cormorant:wght@300;400;700&family=Crimson+Text:wght@400;700&family=DM+Sans:wght@400;700&family=DM+Serif+Display&family=Domine:wght@400;700&family=EB+Garamond:wght@400;700&family=Exo+2:wght@100;400;900&family=Fira+Code:wght@400;700&family=Fira+Sans:wght@100;400;900&family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans:wght@100;400;700&family=IBM+Plex+Serif:wght@300;400;700&family=Inconsolata:wght@400;700&family=Inter:wght@100;400;900&family=Josefin+Sans:wght@100;400;700&family=Karla:wght@400;700&family=Lato:wght@100;400;900&family=Libre+Baskerville:wght@400;700&family=Libre+Franklin:wght@100;400;900&family=Lora:wght@400;700&family=Manrope:wght@200;400;800&family=Merriweather:wght@300;700;900&family=Montserrat:wght@100;400;900&family=Mulish:wght@200;400;900&family=Neuton:wght@400;700&family=Noticia+Text:wght@400;700&family=Nunito:wght@200;400;900&family=Nunito+Sans:wght@200;400;900&family=Old+Standard+TT:wght@400;700&family=Open+Sans:wght@300;400;800&family=Oswald:wght@200;400;700&family=Overpass:wght@100;400;900&family=Oxygen:wght@300;400;700&family=Playfair+Display:wght@400;700;900&family=Poppins:wght@100;400;900&family=PT+Sans:wght@400;700&family=PT+Serif:wght@400;700&family=Quicksand:wght@300;400;700&family=Raleway:wght@100;400;900&family=Roboto+Condensed:wght@300;400;700&family=Roboto+Mono:wght@400;700&family=Roboto+Slab:wght@100;400;900&family=Roboto:wght@100;400;900&family=Rubik:wght@300;400;900&family=Source+Code+Pro:wght@400;700&family=Source+Sans+3:wght@200;400;900&family=Source+Serif+4:wght@200;400;900&family=Space+Grotesk:wght@300;400;700&family=Space+Mono:wght@400;700&family=Spectral:wght@200;400;800&family=Titillium+Web:wght@200;400;900&family=Ubuntu:wght@300;400;700&family=Vollkorn:wght@400;700;900&family=Work+Sans:wght@100;400;900&family=Zilla+Slab:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
