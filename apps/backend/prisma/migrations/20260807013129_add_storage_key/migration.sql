-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "storage_key" TEXT;

-- AlterTable
ALTER TABLE "sphere_files" ADD COLUMN     "storage_key" TEXT;

-- AlterTable
ALTER TABLE "uploaded_files" ADD COLUMN     "storage_key" TEXT;
