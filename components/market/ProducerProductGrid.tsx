"use client";

/**
 * ProducerProductGrid — grid of products with AddToCartButton. Used on shop page.
 */

import Link from "next/link";
import { AddToCartButton } from "./AddToCartButton";
import { DeliveryBadge } from "./DeliveryBadge";
import { formatPrice } from "@/lib/utils";
import { getProductDisplayImage } from "@/lib/product-categories";

export interface ProducerProductGridProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  delivery: boolean;
  pickup: boolean;
  quantityAvailable: number | null;
  unit?: string | null;
  isOrganic?: boolean | null;
}

export interface ProducerProductGridProps {
  products: ProducerProductGridProduct[];
  producerId: string;
}

export function ProducerProductGrid({ products, producerId }: ProducerProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="rounded-xl border border-brand/20 bg-white p-8 text-center text-brand/70">
        No products listed yet.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const soldOut = p.quantityAvailable !== null && p.quantityAvailable === 0;
        return (
          <article
            key={p.id}
            className="flex flex-col overflow-hidden rounded-xl border border-brand/20 bg-white shadow-sm"
          >
            <div className="aspect-[4/3] flex items-center justify-center bg-brand-light overflow-hidden">
              <img
                src={getProductDisplayImage(p.imageUrl, p.category)}
                alt={p.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex gap-2">
                <span className="text-xs font-medium uppercase text-brand/70">{p.category}</span>
                {p.isOrganic === true && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Organic</span>
                )}
              </div>
              <h2 className="font-display mt-1 text-lg font-semibold text-brand">{p.title}</h2>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-brand/80">{p.description}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-semibold text-brand">
                  {formatPrice(p.price)}
                  {p.unit ? ` / ${p.unit}` : ""}
                </span>
                <DeliveryBadge delivery={p.delivery} pickup={p.pickup} />
              </div>
              {soldOut ? (
                <p className="mt-2 text-sm text-amber-700">Sold out</p>
              ) : (
                <div className="mt-3">
                  <AddToCartButton
                    productId={p.id}
                    producerId={producerId}
                    title={p.title}
                    price={p.price}
                    imageUrl={p.imageUrl}
                  />
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
