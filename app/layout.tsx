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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FlagCheck",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#8B5CF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="fr" style={{ backgroundColor: '#0F0F0F' }}>
        <head>
          {/* CRITICAL: Inline CSS to prevent white flash - MUST be BEFORE any other CSS */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
                html {
                  background-color: #0F0F0F !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                }
                
                body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background-color: #0F0F0F !important;
                  width: 100% !important;
                  height: 100% !important;
                  overflow-x: hidden;
                  -webkit-tap-highlight-color: transparent;
                }
                
                * {
                  box-sizing: border-box;
                }
                
                #__next, [data-nextjs-scroll-focus-boundary] {
                  width: 100%;
                  min-height: 100vh;
                  background-color: #0F0F0F !important;
                }
                
                /* Splash Screen */
                #splash-screen {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background: linear-gradient(180deg, #0F0F0F 0%, #1a0a2e 100%);
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  z-index: 9999;
                  transition: opacity 0.5s ease-out;
                }
                
                #splash-screen.fade-out {
                  opacity: 0;
                  pointer-events: none;
                }
                
                .splash-content {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 24px;
                }
                
                .splash-title {
                  font-size: 28px;
                  font-weight: 700;
                  color: #ffffff;
                  margin: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  letter-spacing: 0.5px;
                }
                
                .splash-loader {
                  width: 40px;
                  height: 40px;
                  border: 3px solid rgba(139, 92, 246, 0.2);
                  border-top-color: #8B5CF6;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `,
            }}
          />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
          <meta name="theme-color" content="#8B5CF6" />
          <meta name="msapplication-TileColor" content="#8B5CF6" />
          
          {/* iOS Icons */}
          <link rel="apple-touch-icon" href="/icons/icon-180.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
          <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    if (typeof localStorage !== 'undefined' && localStorage.getItem('flagcheck-splash-shown')) {
                      document.body.setAttribute('data-splash-shown', 'true');
                    }
                  } catch(e) {}
                })();
              `,
            }}
          />
          
          {/* iOS Splash Screens - Tailles principales iPhone */}
          {/* iPhone 14 / 15 / 13 / 12 - 1170x2532 */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 844px) and (device-height: 390px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-14-landscape.png" />
          
          {/* iPhone 13 mini / 12 mini / 11 Pro / XS / X - 1125x2436 */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-13-mini-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 812px) and (device-height: 375px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-13-mini-landscape.png" />
          
          {/* iPhone 14 Pro / 15 Pro - 1179x2556 */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-pro-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 852px) and (device-height: 393px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-14-pro-landscape.png" />
          
          {/* iPhone 14 Pro Max / 15 Pro Max - 1290x2796 */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-pro-max-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 932px) and (device-height: 430px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" href="/splash/iphone-14-pro-max-landscape.png" />
          
          {/* iPhone 8 / 7 / 6s / 6 - 750x1334 */}
          <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/iphone-8-portrait.png" />
          <link rel="apple-touch-startup-image" media="screen and (device-width: 667px) and (device-height: 375px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" href="/splash/iphone-8-landscape.png" />
          
          {/* Fallback pour tous les autres appareils */}
          <link rel="apple-touch-startup-image" href="/splash/default.png" />
        </head>
        <body className={`${inter.variable} antialiased`} style={{ backgroundColor: '#0F0F0F', margin: 0, padding: 0, width: '100%', height: '100%' }}>
          {/* SPLASH SCREEN - Must be BEFORE root content */}
          <div id="splash-screen">
            <div className="splash-content">
              <h1 className="splash-title">FlagCheck</h1>
              <div className="splash-loader"></div>
            </div>
          </div>
          <SplashScreen />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
