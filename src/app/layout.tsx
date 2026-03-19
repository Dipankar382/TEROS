import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppProvider } from "@/lib/AppContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "TEROS — Emergency Healthcare Routing System",
  description: "Advanced Emergency Routing and Navigational System with full-stack capabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
