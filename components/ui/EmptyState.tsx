"use client";

/**
 * Warm Farmhouse — Empty state: title, body, optional primary action.
 */

import Link from "next/link";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  body?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({ title, body, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-brand/10 bg-white p-8 text-center shadow-farmhouse sm:p-10 ${className}`}
    >
      <p className="font-display text-xl font-semibold text-brand leading-tight">{title}</p>
      {body && <p className="mt-2 text-sm text-brand/80 leading-relaxed">{body}</p>}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href}>
              <Button variant="primary" size="md">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button type="button" variant="primary" size="md" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
