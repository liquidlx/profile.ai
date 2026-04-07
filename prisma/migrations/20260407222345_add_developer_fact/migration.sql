-- CreateEnum
CREATE TYPE "FactType" AS ENUM ('SKILL', 'EXPERIENCE', 'ACHIEVEMENT', 'EDUCATION', 'CERTIFICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "FactSourceType" AS ENUM ('RESUME', 'DEVELOPER_INPUT');

-- CreateTable
CREATE TABLE "DeveloperFact" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "factType" "FactType" NOT NULL,
    "claim" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "sourceType" "FactSourceType" NOT NULL,
    "company" TEXT,
    "title" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperFact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeveloperFact" ADD CONSTRAINT "DeveloperFact_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex (HNSW for fast vector similarity search)
CREATE INDEX IF NOT EXISTS developer_fact_embedding_idx
ON "DeveloperFact"
USING hnsw (embedding vector_cosine_ops);
