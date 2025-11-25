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
  themeColor: "#000000",
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
      <html lang="fr" style={{ backgroundColor: '#000000' }}>
        <head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
          <meta name="theme-color" content="#000000" />
          
          {/* iOS Splash Screens - iPhone 14 Pro Max / 15 Pro Max */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-pro-max-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 932px) and (device-height: 430px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-14-pro-max-landscape.png" />
          
          {/* iPhone 14 Pro / 15 Pro */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-pro-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 852px) and (device-height: 393px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-14-pro-landscape.png" />
          
          {/* iPhone 14 Plus / 15 Plus */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-plus-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 926px) and (device-height: 428px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-14-plus-landscape.png" />
          
          {/* iPhone 14 / 15 */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 844px) and (device-height: 390px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-14-landscape.png" />
          
          {/* iPhone 13 Pro Max / 12 Pro Max */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-13-pro-max-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 926px) and (device-height: 428px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-13-pro-max-landscape.png" />
          
          {/* iPhone 13 Pro / 12 Pro */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-13-pro-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 844px) and (device-height: 390px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-13-pro-landscape.png" />
          
          {/* iPhone 13 / 12 */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-13-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 844px) and (device-height: 390px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-13-landscape.png" />
          
          {/* iPhone 13 mini / 12 mini */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-13-mini-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 812px) and (device-height: 375px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-13-mini-landscape.png" />
          
          {/* iPhone 11 Pro Max / XS Max */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-11-pro-max-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 896px) and (device-height: 414px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-11-pro-max-landscape.png" />
          
          {/* iPhone 11 Pro / XS / X */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-11-pro-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 812px) and (device-height: 375px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-11-pro-landscape.png" />
          
          {/* iPhone 11 / XR */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/iphone-11-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 896px) and (device-height: 414px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" href="/splash/iphone-11-landscape.png" />
          
          {/* iPhone SE (3rd gen) / 8 Plus */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-8-plus-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 736px) and (device-height: 414px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-8-plus-landscape.png" />
          
          {/* iPhone SE (2nd/3rd gen) / 8 / 7 / 6s / 6 */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/iphone-8-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 667px) and (device-height: 375px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" href="/splash/iphone-8-landscape.png" />
          
          {/* Fallback pour tous les autres appareils */}
          <link rel="apple-touch-startup-image" href="/splash/default.png" />
          
          <link rel="stylesheet" href="/critical.css" />
        </head>
        <body className={`${inter.variable} antialiased`} style={{ backgroundColor: '#000000', margin: 0, padding: 0 }}>
          <SplashScreen />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
