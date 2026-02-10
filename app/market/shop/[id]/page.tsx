/**
 * Market — producer storefront. Public shop page for a producer.
 * Path: /market/shop/[id] (deep links map 1:1; PWA + app use same path).
 * TODO: Load producer and products by id from DB.
 */

import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";

interface ShopPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { id } = await params;
  // TODO: const producer = await prisma.user.findUnique({ where: { id, role: 'PRODUCER' }, include: { products: true } });
  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/market/browse" className="text-brand-accent hover:underline">
          ← Back to browse
        </Link>
        <h1 className="font-display mt-4 text-3xl font-semibold text-brand">
          Producer shop
        </h1>
        <p className="text-brand/80">Producer ID: {id}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder; replace with producer.products */}
          <ProductCard
            id="1"
            title="Sample item"
            description="From this producer."
            price={4.5}
            imageUrl={null}
            category="Produce"
            delivery={true}
            pickup={true}
            producerId={id}
          />
        </div>
      </div>
    </div>
  );
}
