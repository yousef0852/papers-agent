import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI Mind — The History of Artificial Intelligence, mapped as you learn it",
  description: "a living chart of how machines learned to think",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Prevent flash of wrong theme AND locale direction */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){
            var t=localStorage.getItem('ai-mind-theme');
            if(t!=='light')document.documentElement.classList.add('dark');
            var l=localStorage.getItem('ai-mind-locale');
            if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}
          })()`
        }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
