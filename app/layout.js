import "./globals.css";

export const metadata = {
  title: "Cautela & Vistoria",
  description:
    "Cautela & Vistoria da Polícia Militar Rodoviária (PMSC).",
  other: { "theme-color": "#008448" },
  icons: { icon: "/favicon.ico", apple: "/splash.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#008448",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
