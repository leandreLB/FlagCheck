import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
// import "./globals.css";
import "./styles.css";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FlagCheck - Dating Profile Scanner",
  description: "Scan dating profiles for red flags",
  manifest: "/manifest.json",
  themeColor: "#0F0F0F",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FlagCheck",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
          <meta name="theme-color" content="#0F0F0F" />
          <link rel="apple-touch-startup-image" href="/splash.png" />
        </head>
        <body className={`${inter.variable} antialiased`}>
          <SplashScreen />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
