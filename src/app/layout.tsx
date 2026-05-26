import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nuronai.com"),
  title: {
    default: "Nuron AI | AI Employees That Sell & Support 24/7",
    template: "%s | Nuron AI"
  },
  description: "Build, train, and deploy AI sales and support agents for your business. Nuron AI goes beyond simple chatbots to create a full AI workforce that captures leads, recommends products, and drives conversions 24/7.",
  keywords: ["AI agent", "AI employee", "sales automation", "lead capture", "AI chatbot", "customer support AI", "AI SaaS", "generative AI for business"],
  authors: [{ name: "Nuron AI Team" }],
  creator: "Nuron AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nuronai.com",
    title: "Nuron AI — AI Employees That Sell & Support",
    description: "Build, train, and deploy AI sales and support agents for your business. Capture leads, recommend products, and drive conversions 24/7.",
    siteName: "Nuron AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nuron AI — AI Employees That Sell & Support",
    description: "Build, train, and deploy AI sales and support agents for your business. Capture leads, recommend products, and drive conversions 24/7.",
    creator: "@NuronAI",
  },
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Nuron AI",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Nuron AI is a platform to build, train, and deploy AI sales and support agents for your business. Our AI employees capture leads, recommend products, and drive conversions 24/7.",
  "url": "https://nuronai.com",
  "publisher": {
    "@type": "Organization",
    "name": "Nuron AI",
    "url": "https://nuronai.com"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ backgroundColor: "#0a0a0b" }} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
