-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DEVELOPER', 'RECRUITER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "profilePic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeveloperProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "cvUrl" TEXT NOT NULL,
    "allowDownload" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL,
    "keySkills" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeveloperProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT,
    "position" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeChunk" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "chunkText" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterQuestion" (
    "id" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProfile_userId_key" ON "DeveloperProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeveloperProfile_slug_key" ON "DeveloperProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterProfile_userId_key" ON "RecruiterProfile"("userId");

-- AddForeignKey
ALTER TABLE "DeveloperProfile" ADD CONSTRAINT "DeveloperProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterProfile" ADD CONSTRAINT "RecruiterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeChunk" ADD CONSTRAINT "ResumeChunk_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterQuestion" ADD CONSTRAINT "RecruiterQuestion_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "DeveloperProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterQuestion" ADD CONSTRAINT "RecruiterQuestion_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "RecruiterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
