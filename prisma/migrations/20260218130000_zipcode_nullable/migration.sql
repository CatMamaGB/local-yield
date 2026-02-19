-- Make User.zipCode nullable; do not store "00000" for missing ZIP.
UPDATE "User" SET "zipCode" = NULL WHERE "zipCode" = '00000';
ALTER TABLE "User" ALTER COLUMN "zipCode" DROP NOT NULL;
