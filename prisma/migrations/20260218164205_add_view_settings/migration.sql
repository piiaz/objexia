/*
  Warnings:

  - You are about to drop the column `laneId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Roadmap` table. All the data in the column will be lost.
  - You are about to drop the column `pdatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,title]` on the table `Roadmap` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `groupId` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Made the column `startDate` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `Lane` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `color` to the `Milestone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `Milestone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icon` to the `Milestone` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_laneId_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "laneId",
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackIndex" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "startDate" SET DATA TYPE TEXT,
ALTER COLUMN "endDate" SET NOT NULL,
ALTER COLUMN "endDate" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Lane" ALTER COLUMN "color" SET NOT NULL,
ALTER COLUMN "type" DROP DEFAULT,
ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Milestone" ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "icon" TEXT NOT NULL,
ADD COLUMN     "trackIndex" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "date" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Roadmap" DROP COLUMN "updatedAt",
ADD COLUMN     "endDate" TEXT,
ADD COLUMN     "showWeekends" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startDate" TEXT,
ADD COLUMN     "timeView" TEXT NOT NULL DEFAULT 'Month',
ALTER COLUMN "lastEdited" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "pdatedAt",
ALTER COLUMN "provider" DROP NOT NULL,
ALTER COLUMN "provider" SET DEFAULT 'email';

-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_userId_title_key" ON "Roadmap"("userId", "title");
