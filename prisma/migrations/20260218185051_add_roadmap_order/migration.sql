-- AlterTable
ALTER TABLE "Roadmap" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "showWeekends" SET DEFAULT false;
