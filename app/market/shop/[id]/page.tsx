/**
 * Market — producer storefront (business page). Public shop page for a producer.
 * Loads producer, profile, upcoming events, and products.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDistanceBetweenZips } from "@/lib/geo";
import { ProducerHeader } from "@/components/ProducerHeader";
import { ProducerProductGrid } from "@/components/ProducerProductGrid";

interface ShopPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { id } = await params;
  const producer = await prisma.user.findFirst({
    where: { id, isProducer: true },
    include: {
      products: {
        where: {},
        orderBy: { createdAt: "desc" },
      },
      producerProfile: true,
    },
  });

  if (!producer) notFound();

  const upcomingEvents = await prisma.event.findMany({
    where: { userId: id, eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
    take: 10,
  });

  const user = await getCurrentUser();
  const viewerZip = user?.zipCode;
  const distanceMiles =
    viewerZip && producer.zipCode
      ? getDistanceBetweenZips(viewerZip, producer.zipCode)
      : null;

  const profile = producer.producerProfile;
  const offersDelivery = profile?.offersDelivery ?? false;
  const deliveryFeeCents = profile?.deliveryFeeCents ?? 0;
  const anyPickup = producer.products.some((p) => p.pickup);

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/market/browse" className="text-brand-accent hover:underline">
          ← Back to browse
        </Link>
        <div className="mt-4">
          <ProducerHeader
            name={producer.name}
            bio={producer.bio}
            distanceMiles={distanceMiles}
            offersDelivery={offersDelivery}
            deliveryFeeCents={deliveryFeeCents}
            pickup={anyPickup}
            profileImageUrl={profile?.profileImageUrl ?? null}
            aboutUs={profile?.aboutUs ?? null}
            story={profile?.story ?? null}
            upcomingEvents={upcomingEvents.map((e) => ({
              id: e.id,
              name: e.name,
              location: e.location,
              eventDate: e.eventDate.toISOString(),
              eventHours: e.eventHours,
            }))}
            contactEmail={profile?.acceptInAppMessagesOnly ? null : profile?.contactEmail ?? null}
            generalLocation={profile?.generalLocation ?? null}
            availabilityHours={profile?.availabilityHours ?? null}
          />
        </div>
        <div className="mt-8">
          <ProducerProductGrid
            products={producer.products.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              price: p.price,
              imageUrl: p.imageUrl,
              category: p.category,
              delivery: p.delivery,
              pickup: p.pickup,
              quantityAvailable: p.quantityAvailable,
            }))}
            producerId={producer.id}
          />
        </div>
      </div>
    </div>
  );
}
