"use client";

/**
 * Accessible FAQ accordion: keyboard (Enter/Space), aria-expanded, aria-controls.
 * One h1 per page; headings here are h2/h3 for hierarchy.
 */

import { useState, useId } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface FAQAccordionProps {
  /** Section title (e.g. "Market FAQs" or "Care FAQs") — rendered as h2 */
  title: string;
  items: FAQItem[];
  /** Optional id for the section (for anchor links) */
  sectionId?: string;
  className?: string;
}

export function FAQAccordion({ title, items, sectionId, className = "" }: FAQAccordionProps) {
  const baseId = useId().replace(/:/g, "-");
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(id);
    }
  }

  return (
    <section
      id={sectionId}
      className={className}
      aria-labelledby={`faq-heading-${baseId}`}
    >
      <h2
        id={`faq-heading-${baseId}`}
        className="font-display text-xl font-semibold text-brand mb-4"
      >
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((item) => {
          const isOpen = openId === item.id;
          const triggerId = `faq-trigger-${baseId}-${item.id}`;
          const panelId = `faq-panel-${baseId}-${item.id}`;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-brand/10 bg-white shadow-farmhouse overflow-hidden"
            >
              <h3 className="m-0">
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, item.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium text-brand hover:bg-brand-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-inset"
                >
                  <span>{item.question}</span>
                  <ChevronDownIcon
                    className={`h-5 w-5 shrink-0 text-brand/70 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className="border-t border-brand/10"
              >
                <div className="px-4 py-3 text-brand/90 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
