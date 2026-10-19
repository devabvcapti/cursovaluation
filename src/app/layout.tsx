import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { courseContent } from "@/content/curso";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
});

const museoSans = localFont({
  src: [
    {
      path: "../fonts/MuseoSans/MuseoSans-300.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/MuseoSans/MuseoSans_500.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/MuseoSans/MuseoSans_700.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/MuseoSans/MuseoSans_900.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

const title = courseContent.hero.headlineLines.join(" ");
const description = courseContent.hero.subheadline;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    images: ["/brand/og-placeholder.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body
        className={`${montserrat.variable} ${museoSans.variable} min-h-full flex flex-col`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
