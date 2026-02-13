"use client";

/**
 * Homepage FAQ: Market FAQ and Care FAQ.
 * Short, concise. Accordion with accessible controls.
 */

import { FAQAccordion, type FAQItem } from "./FAQAccordion";

const marketItems: FAQItem[] = [
  {
    id: "market-licensed",
    question: "Do I need to be a licensed business to sell?",
    answer: (
      <>
        You must follow your local laws and cottage food regulations. We do not provide legal
        advice, but we provide guidance.
      </>
    ),
  },
  {
    id: "market-taxes",
    question: "Does The Local Yield handle taxes?",
    answer: (
      <>
        Sellers are responsible for reporting and paying their own taxes.
      </>
    ),
  },
  {
    id: "market-shipped",
    question: "Are items shipped?",
    answer: (
      <>
        No. Orders are local pickup or arranged delivery only.
      </>
    ),
  },
];

const careItems: FAQItem[] = [
  {
    id: "care-gig-app",
    question: "Is this a gig app?",
    answer: (
      <>
        No. Care is structured for livestock owners and homesteads, not on-demand casual pet
        sitting.
      </>
    ),
  },
  {
    id: "care-insure",
    question: "Does The Local Yield insure bookings?",
    answer: (
      <>
        No. We provide structure and messaging, but users are responsible for agreements and
        insurance.
      </>
    ),
  },
  {
    id: "care-meet-first",
    question: "Can I meet a caregiver first?",
    answer: (
      <>
        Yes. We encourage clear communication before bookings.
      </>
    ),
  },
];

export function HomeFAQ() {
  return (
    <div className="space-y-10">
      <FAQAccordion
        title="Market FAQ"
        items={marketItems}
        sectionId="faq-market"
      />
      <FAQAccordion
        title="Care FAQ"
        items={careItems}
        sectionId="faq-care"
      />
    </div>
  );
}
