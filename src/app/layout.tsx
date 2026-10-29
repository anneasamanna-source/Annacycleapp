import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Sans_Bengali } from "next/font/google";
import { getDict, getLocale } from "@/lib/i18n";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  variable: "--font-bengali",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const d = await getDict();
  return {
    title: { default: "ANNA CYCLE", template: "%s · ANNA CYCLE" },
    description: d.meta.description,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#183D32",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, d] = await Promise.all([getLocale(), getDict()]);

  return (
    <html lang={locale} className={`${manrope.variable} ${bengali.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-forest focus:px-4 focus:py-3 focus:text-ivory"
        >
          {d.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
