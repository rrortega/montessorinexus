-- DropForeignKey
ALTER TABLE "admission_applications" DROP CONSTRAINT "admission_applications_enrolled_student_id_fkey";
ALTER TABLE "admission_applications" DROP CONSTRAINT "admission_applications_school_id_fkey";
ALTER TABLE "admission_applications" DROP CONSTRAINT "admission_applications_stage_id_fkey";
ALTER TABLE "admission_applications" DROP CONSTRAINT "admission_applications_target_environment_id_fkey";
ALTER TABLE "admission_form_templates" DROP CONSTRAINT "admission_form_templates_school_id_fkey";
ALTER TABLE "admission_stages" DROP CONSTRAINT "admission_stages_school_id_fkey";
ALTER TABLE "waitlist_entries" DROP CONSTRAINT "waitlist_entries_admission_application_id_fkey";

-- Rename Tables
ALTER TABLE "admission_stages" RENAME TO "process_stages";
ALTER TABLE "admission_applications" RENAME TO "process_applications";
ALTER TABLE "admission_form_templates" RENAME TO "process_form_templates";

-- Rename Primary Keys
ALTER TABLE "process_stages" RENAME CONSTRAINT "admission_stages_pkey" TO "process_stages_pkey";
ALTER TABLE "process_applications" RENAME CONSTRAINT "admission_applications_pkey" TO "process_applications_pkey";
ALTER TABLE "process_form_templates" RENAME CONSTRAINT "admission_form_templates_pkey" TO "process_form_templates_pkey";

-- Rename Waitlist Column
ALTER TABLE "waitlist_entries" RENAME COLUMN "admission_application_id" TO "process_application_id";

-- Create processes table
CREATE TABLE "processes" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Layers',
    "description" TEXT DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processes_school_id_slug_key" ON "processes"("school_id", "slug");

-- Seed default admissions process for existing schools
INSERT INTO "processes" ("id", "school_id", "name", "slug", "label", "icon", "description", "is_active", "created_at", "updated_at")
SELECT 
  gen_random_uuid()::text,
  "id",
  'Admisión',
  'admissions',
  'Admisiones',
  'Layers',
  'Proceso de admisión predeterminado',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "schools"
ON CONFLICT ("school_id", "slug") DO NOTHING;

-- Add process_id to renamed tables as nullable
ALTER TABLE "process_stages" ADD COLUMN "process_id" TEXT;
ALTER TABLE "process_applications" ADD COLUMN "process_id" TEXT;

-- Associate existing stages and applications with the seeded admissions process
UPDATE "process_stages" ps
SET "process_id" = p.id
FROM "processes" p
WHERE ps.school_id = p.school_id AND p.slug = 'admissions';

UPDATE "process_applications" pa
SET "process_id" = p.id
FROM "processes" p
WHERE pa.school_id = p.school_id AND p.slug = 'admissions';

-- Make process_id column NOT NULL now that it is populated
ALTER TABLE "process_stages" ALTER COLUMN "process_id" SET NOT NULL;
ALTER TABLE "process_applications" ALTER COLUMN "process_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_process_application_id_fkey" FOREIGN KEY ("process_application_id") REFERENCES "process_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processes" ADD CONSTRAINT "processes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_stages" ADD CONSTRAINT "process_stages_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_stages" ADD CONSTRAINT "process_stages_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_applications" ADD CONSTRAINT "process_applications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_applications" ADD CONSTRAINT "process_applications_process_id_fkey" FOREIGN KEY ("process_id") REFERENCES "processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_applications" ADD CONSTRAINT "process_applications_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "process_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_applications" ADD CONSTRAINT "process_applications_enrolled_student_id_fkey" FOREIGN KEY ("enrolled_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_applications" ADD CONSTRAINT "process_applications_target_environment_id_fkey" FOREIGN KEY ("target_environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_form_templates" ADD CONSTRAINT "process_form_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
