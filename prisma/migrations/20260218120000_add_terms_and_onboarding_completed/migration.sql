-- AlterTable User: terms and onboarding completion for redirect/checklist/analytics
ALTER TABLE "User" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "onboarding_completed_at" TIMESTAMP(3);
