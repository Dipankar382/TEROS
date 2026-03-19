import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProvider } from "@/lib/AppContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TEROS — AI Emergency Healthcare Routing",
  description: "Advanced AI-driven emergency routing and navigational intelligence for critical medical transport.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TEROS",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "TEROS — AI Emergency Healthcare Routing",
    description: "Advanced AI-driven emergency routing and navigational intelligence.",
    url: "https://teros-app.netlify.app",
    siteName: "TEROS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={spaceMono.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
             __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('teros-theme');
                  var preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (savedTheme === 'dark' || (!savedTheme && preferDark)) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
