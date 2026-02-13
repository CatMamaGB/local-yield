/**
 * Caregiver profile page with trust signals, listings, reviews, and booking form.
 */

import { notFound } from "next/navigation";
import { getCaregiverProfile } from "@/lib/care";
import { BookingForm } from "./BookingForm";
import { getCurrentUser } from "@/lib/auth";
import type { AnimalSpecies, CareServiceType, CareTaskType, ExperienceBackground } from "@prisma/client";

interface CaregiverPageProps {
  params: Promise<{ id: string }>;
}

// UI labels (i18n-friendly structure)
const LABELS = {
  species: {
    HORSES: "Horses",
    CATTLE: "Cattle",
    GOATS: "Goats",
    SHEEP: "Sheep",
    PIGS: "Pigs",
    POULTRY: "Poultry",
    ALPACAS: "Alpacas",
    LLAMAS: "Llamas",
    DONKEYS: "Donkeys",
    OTHER: "Other",
  },
  serviceType: {
    DROP_IN: "Drop-in visits",
    OVERNIGHT: "Overnight care",
    BOARDING: "Boarding",
    FARM_SITTING: "Farm sitting",
  },
  tasks: {
    FEEDING: "Feeding",
    WATERING: "Watering",
    MUCKING: "Mucking",
    TURNOUT: "Turnout",
    MEDS_ORAL: "Oral meds",
    MEDS_INJECTION: "Injections",
    WOUND_CARE: "Wound care",
    HERD_CHECK: "Herd checks",
    EGG_COLLECTION: "Egg collection",
    MILKING: "Milking",
    LAMBING_FOALING_SUPPORT: "Lambing/foaling",
    EQUIPMENT_USE: "Equipment",
    OTHER: "Other",
  },
  experience: {
    GREW_UP_FARM: "Grew up on farm",
    FAMILY_OPERATION: "Family operation",
    RANCH_WORK: "Ranch work",
    BARN_MANAGER: "Barn manager",
    VET_ASSISTANT: "Vet assistant",
    SHOW_CIRCUIT: "Show circuit",
    SELF_TAUGHT: "Self-taught",
    FORMAL_AG_EDU: "Formal ag education",
    FFA_4H: "FFA/4H",
    OTHER: "Other",
  },
} as const;

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function CaregiverProfilePage({ params }: CaregiverPageProps) {
  const { id } = await params;
  const profile = await getCaregiverProfile(id);
  const user = await getCurrentUser();

  if (!profile) {
    notFound();
  }

  const { caregiverProfile, listings, reviews } = profile;

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-brand leading-tight">
            {profile.name || "Caregiver"}
          </h1>
          {profile.zipCode && (
            <p className="mt-1 text-brand/80">Location: {profile.zipCode}</p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {caregiverProfile && (
              <section className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
                <h2 className="font-display text-xl font-semibold text-brand mb-4 leading-tight">
                  Experience & Trust
                </h2>

                {caregiverProfile.yearsExperience && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-brand/80">Years of experience</p>
                    <p className="text-lg font-semibold text-brand mt-0.5">
                      {caregiverProfile.yearsExperience} {caregiverProfile.yearsExperience === 1 ? "year" : "years"}
                    </p>
                  </div>
                )}

                {caregiverProfile.experienceBackground && caregiverProfile.experienceBackground.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-brand/80 mb-2">Background</p>
                    <div className="flex flex-wrap gap-2">
                      {caregiverProfile.experienceBackground.map((bg) => (
                        <span
                          key={bg}
                          className="rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-brand"
                        >
                          {LABELS.experience[bg as ExperienceBackground] || bg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {caregiverProfile.speciesComfort && caregiverProfile.speciesComfort.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-brand/80 mb-2">Species comfort</p>
                    <div className="flex flex-wrap gap-2">
                      {caregiverProfile.speciesComfort.map((species) => (
                        <span
                          key={species}
                          className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800"
                        >
                          {LABELS.species[species as AnimalSpecies] || species}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {caregiverProfile.tasksComfort && caregiverProfile.tasksComfort.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-brand/80 mb-2">Tasks comfortable with</p>
                    <div className="flex flex-wrap gap-2">
                      {caregiverProfile.tasksComfort.map((task) => (
                        <span
                          key={task}
                          className="rounded-full bg-brand-light px-3 py-1 text-sm font-medium text-brand"
                        >
                          {LABELS.tasks[task as CareTaskType] || task}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {caregiverProfile.introVideoUrl && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-brand/70 mb-2">Intro video</p>
                    <a
                      href={caregiverProfile.introVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-accent hover:underline"
                    >
                      Watch video →
                    </a>
                  </div>
                )}

                {caregiverProfile.introAudioUrl && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-brand/70 mb-2">Intro audio</p>
                    <audio controls className="w-full">
                      <source src={caregiverProfile.introAudioUrl} />
                    </audio>
                  </div>
                )}

                {caregiverProfile.referencesText && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-brand/70 mb-2">References</p>
                    <p className="text-sm text-brand/80 whitespace-pre-line">
                      {caregiverProfile.referencesText}
                    </p>
                  </div>
                )}

                {caregiverProfile.bio && (
                  <div className="mt-4 pt-4 border-t border-brand/10">
                    <p className="text-sm font-medium text-brand/80 mb-2">About</p>
                    <p className="text-sm text-brand/80 whitespace-pre-line leading-relaxed">{caregiverProfile.bio}</p>
                  </div>
                )}
              </section>
            )}

            {listings.length > 0 && (
              <section className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
                <h2 className="font-display text-xl font-semibold text-brand mb-4 leading-tight">
                  Services & Rates
                </h2>
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="border-b border-brand/10 pb-4 last:border-0 last:pb-0">
                      <h3 className="font-semibold text-brand">{listing.title}</h3>
                      <p className="text-sm text-brand/80 mt-1">
                        {LABELS.serviceType[listing.serviceType]}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {listing.speciesSupported.map((species) => (
                          <span
                            key={species}
                            className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800"
                          >
                            {LABELS.species[species as AnimalSpecies] || species}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-lg font-semibold text-brand">
                        {formatPrice(listing.rateCents)} {listing.rateUnit}
                      </p>
                      {listing.description && (
                        <p className="mt-2 text-sm text-brand/80">{listing.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {reviews.length > 0 && (
              <section className="rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
                <h2 className="font-display text-xl font-semibold text-brand mb-4 leading-tight">
                  Reviews ({reviews.length})
                </h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-brand/10 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-brand">
                          {review.reviewer.name || "Anonymous"}
                        </p>
                        {review.rating && (
                          <p className="text-sm text-brand/70">
                            {"⭐".repeat(review.rating)}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-brand/80">{review.comment}</p>
                      {review.createdAt && (
                        <p className="mt-1 text-xs text-brand/60">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-xl border border-brand/10 bg-white p-6 shadow-farmhouse">
              {user ? (
                <BookingForm caregiverId={id} />
              ) : (
                <div className="text-center">
                  <p className="text-brand/80 mb-4 leading-relaxed">
                    Sign in to request a booking
                  </p>
                  <a
                    href="/auth/login"
                    className="inline-flex items-center justify-center rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                  >
                    Sign in
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
