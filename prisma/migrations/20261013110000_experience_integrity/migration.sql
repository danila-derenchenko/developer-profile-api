CREATE UNIQUE INDEX "Experience_profileId_company_position_startDate_key"
ON "Experience"("profileId", "company", "position", "startDate");
DROP INDEX "Experience_profileId_idx";

ALTER TABLE "Experience" ADD CONSTRAINT "Experience_valid_period"
CHECK ("endDate" IS NULL OR "endDate" >= "startDate");
