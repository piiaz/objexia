/*
  Warnings:

  - You are about to drop the column `groupId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `trackIndex` on the `Item` table. All the data in the column will be lost.
  - The `startDate` column on the `Item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `endDate` column on the `Item` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `color` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `trackIndex` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Roadmap` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Roadmap` table. All the data in the column will be lost.
  - Changed the type of `date` on the `Milestone` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `Roadmap` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Roadmap_userId_title_key";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "groupId",
DROP COLUMN "progress",
DROP COLUMN "trackIndex",
ADD COLUMN     "laneId" TEXT,
DROP COLUMN "startDate",
ADD COLUMN     "startDate" TIMESTAMP(3),
DROP COLUMN "endDate",
ADD COLUMN     "endDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Lane" ALTER COLUMN "color" DROP NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'lane',
ALTER COLUMN "order" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Milestone" DROP COLUMN "color",
DROP COLUMN "groupId",
DROP COLUMN "icon",
DROP COLUMN "trackIndex",
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Roadmap" DROP COLUMN "endDate",
DROP COLUMN "startDate",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "lastEdited" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "lastName" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_laneId_fkey" FOREIGN KEY ("laneId") REFERENCES "Lane"("id") ON DELETE SET NULL ON UPDATE CASCADE;
