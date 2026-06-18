import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Notebook",
  description: "a living chart of how machines learned to think",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Runs synchronously before React hydration — prevents any theme flash.
            Defaults to dark if no preference is saved. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ai-mind-theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
