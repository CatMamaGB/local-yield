/**
 * Site footer: legal and trust links + copyright.
 * Warm farmhouse style; clear link text for a11y.
 */

import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/community-guidelines", label: "Community Guidelines" },
  { href: "/seller-guidelines", label: "Seller Guidelines" },
  { href: "/care-safety", label: "Care & Safety" },
] as const;

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-brand/10 bg-white/80 mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm"
          aria-label="Footer navigation"
        >
          {footerLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-brand/80 hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-light rounded"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 text-center text-sm text-brand/70">
          © {currentYear} The Local Yield. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
