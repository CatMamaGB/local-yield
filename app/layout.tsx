import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "@/components/Navbar";
import { CartProvider } from "@/contexts/CartContext";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Local Yield | Marketplace for Local Goods",
  description: "Browse and buy local goods. No shipping — pickup and delivery near you.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Local Yield",
  },
};

export const viewport: Viewport = {
  themeColor: "#5D4524",
};

// getCurrentUser() returns null for logged-out users (when real auth is wired); never throws. No auth forced on any page.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const content = (
    <CartProvider>
      <Navbar user={user} />
      {children}
    </CartProvider>
  );
  return (
    <html lang="en">
      <body
        className={`${playfairDisplay.variable} ${inter.variable} antialiased`}
      >
        {clerkPublishableKey ? (
          <ClerkProvider publishableKey={clerkPublishableKey}>{content}</ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
