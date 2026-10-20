import type { Metadata, Viewport } from "next";
import { Shell } from "@/components/shell/shell";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Immo Bell — Gestion locative à Douala", template: "%s · Immo Bell" },
  description:
    "Immo Bell : gestion locative et valorisation immobilière à Bonanjo, Douala. Trouvez, comparez et réservez un logement, un local ou un fonds de commerce.",
  openGraph: { type: "website", locale: "fr_CM", siteName: "Immo Bell" },
  icons: { icon: "/logo.png" },
};

export const viewport: Viewport = { themeColor: "#F2B000" };

/* Applique le thème mémorisé avant l'affichage, pour éviter un flash. */
const themeScript = `try{var t=localStorage.getItem("immobell_theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Immo Bell",
  email: "contact@immobell.cm",
  address: { "@type": "PostalAddress", addressLocality: "Douala", addressRegion: "Littoral", addressCountry: "CM" },
  areaServed: "Douala",
  openingHours: "Mo-Fr 08:00-18:00",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
