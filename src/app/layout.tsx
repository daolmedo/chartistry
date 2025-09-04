import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "chartz.ai - AI-Powered Data Visualization Platform",
    template: "%s | chartz.ai"
  },
  description: "Turn data into stunning dashboards and charts in seconds. Create beautiful data visualizations effortlessly with AI. The fastest way to generate professional charts from your data.",
  keywords: [
    "data visualization", 
    "AI charts", 
    "dashboard creation", 
    "business intelligence", 
    "data analytics", 
    "chart generator", 
    "tableau alternative", 
    "automated charts",
    "data insights",
    "visualization tool"
  ],
  authors: [{ name: "chartz.ai" }],
  creator: "chartz.ai",
  publisher: "chartz.ai",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://chartz.ai',
    title: 'chartz.ai - AI-Powered Data Visualization Platform',
    description: 'Turn data into stunning dashboards and charts in seconds. Create beautiful data visualizations effortlessly with AI.',
    siteName: 'chartz.ai',
    images: [{
      url: 'https://chartz.ai/og-image.png',
      width: 1200,
      height: 630,
      alt: 'chartz.ai - AI-Powered Data Visualization',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'chartz.ai - AI-Powered Data Visualization Platform',
    description: 'Turn data into stunning dashboards and charts in seconds. Create beautiful data visualizations effortlessly with AI.',
    images: ['https://chartz.ai/og-image.png'],
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: 'https://chartz.ai',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-geist`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
