import "./globals.css";
import NavBar from "./NavBar";
import SovereignGate from "./SovereignGate";

export const metadata = {
  title: "GYO UPLOAD SYSTEM",
  description: "Notion Data Entry Terminal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="gyo-body">
        <SovereignGate>
          <NavBar />
          {children}
        </SovereignGate>
      </body>
    </html>
  );
}
