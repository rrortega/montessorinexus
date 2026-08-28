-- AlterTable
ALTER TABLE "process_applications" ADD COLUMN     "membership_id" TEXT;

-- AlterTable
ALTER TABLE "processes" ADD COLUMN     "resolution_action" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "target_type" TEXT NOT NULL DEFAULT 'STUDENT';

-- AddForeignKey
ALTER TABLE "process_applications" ADD CONSTRAINT "process_applications_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "school_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
