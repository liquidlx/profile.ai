# Profile.AI — Product & Development Guide

> **Purpose**: This document defines the product vision, principles, and technical guidelines for Profile.AI. Reference this guide in all development conversations to maintain consistency and focus.

---

## 🎯 Product Vision

**Profile.AI is an AI-assisted application toolkit that helps software engineers apply to a specific job with clarity, relevance, and honesty.**

### Core Philosophy

Instead of automatically writing application materials, the system:
- **Structures and tailors existing experience**
- **Guides the user in writing high-quality application content in their own voice**

**The goal is not automation, but augmentation.**

---

## 🚫 What Profile.AI Is NOT

**Critical boundaries to maintain:**

- ❌ **Not an auto-apply tool** — We don't automate job applications
- ❌ **Not a mass application system** — MVP supports one application at a time
- ❌ **Not a resume or cover-letter generator that writes on your behalf** — Users write their own content
- ❌ **Not a recruiter-facing product** (in the MVP) — This is developer-focused
- ❌ **Not a generic chat assistant** — This is a focused, intentional application toolkit
- ❌ **Not a tool that invents or exaggerates experience** — Evidence-first, always

---

## ✅ MVP Scope (Focused, but Complete)

The MVP supports **one job application at a time, end-to-end**.

### 1. Job-Tailored Resume (Main Feature)

**What it does:**
- Generates a job-specific resume PDF by:
  - Reordering sections
  - Rewriting bullets for relevance
  - Prioritizing skills and projects
  - **Without adding, inventing, or exaggerating experience**

**Output:**
- ATS-friendly PDF
- Based exclusively on evidence from the original resume
- Ready to submit

**This is the primary artifact of the MVP.**

### 2. Cover Letter Guidance (Assisted, Not Written)

**What it does:**
Instead of writing the cover letter, the system provides structured guidance to help the user write their own.

**Output (not a full letter):**
- Key talking points to include
- Relevant experiences to reference (with evidence)
- Suggested structure (paragraph-by-paragraph outline)
- Tone recommendations based on the role
- Things not to claim or emphasize (missing evidence)

**Example guidance sections:**
- Opening angle: how to introduce interest in the role
- Core experience to highlight: specific projects or responsibilities
- Company alignment hooks: where to connect experience to the job
- Closing suggestions: how to end confidently without overclaiming

**The user remains the author.**

### 3. Application Gap Analysis

**What it does:**
Analyzes the job description against the resume to identify:
- Requirements that are strongly supported
- Requirements that are partially supported
- Requirements not present in the resume

**Output:**
- Clear list of gaps
- Honest explanation of each gap
- Suggestions on how to:
  - Address them in the cover letter, or
  - Safely omit them

**No fake "fit scores". Just clarity.**

### 4. Resume & Application Notes (Internal Use)

**What it does:**
Provides private notes to the applicant, such as:
- "This role emphasizes system design — highlight X project more."
- "Avoid claiming Y; it is not present in your resume."
- "This role seems backend-heavy; move frontend experience lower."

**These notes are not part of the resume or cover letter — they are coaching hints.**

### 5. One-Application Workspace

The MVP treats each application as a single workspace, containing:
- Job description
- Tailored resume output
- Cover letter guidance
- Gap analysis
- Notes and recommendations

**No multi-job dashboards or pipelines in the MVP.**

---

## 🤖 AI Philosophy

### Core Principles

1. **Evidence-first**
   - All outputs must be traceable to source material (resume, job description)
   - Never invent experience, skills, or achievements
   - When evidence is missing, state it clearly

2. **Assistive, not authoritative**
   - AI provides guidance and structure
   - User makes final decisions
   - AI suggests, user writes

3. **Preference for omission over invention**
   - Better to leave something out than to make it up
   - If evidence doesn't support a claim, don't suggest it

4. **The user is always the final decision-maker**
   - All outputs are suggestions
   - User can override any recommendation
   - System provides rationale, not mandates

### AI Usage Guidelines

**When generating resume content:**
- ✅ Reorder existing sections based on job relevance
- ✅ Rewrite bullets to emphasize relevant aspects
- ✅ Prioritize skills that match the job
- ❌ Add new experiences not in the original resume
- ❌ Invent achievements or metrics
- ❌ Exaggerate responsibilities

**When generating cover letter guidance:**
- ✅ Provide structured outlines
- ✅ Suggest relevant experiences to reference
- ✅ Recommend tone and approach
- ✅ Warn about unsupported claims
- ❌ Write the actual cover letter text
- ❌ Create fictional connections to the company

**When analyzing gaps:**
- ✅ Clearly identify missing requirements
- ✅ Explain why something is missing
- ✅ Suggest how to address (or omit) gaps
- ❌ Create fake "fit scores" or percentages
- ❌ Suggest inventing experience to fill gaps

---

## 🏗️ Technical Architecture

### Core Modules

1. **Resume ingestion & embeddings** (existing)
   - PDF parsing
   - Text extraction
   - Chunking with overlap
   - Vector embedding generation
   - Storage in pgvector

2. **Job description analysis**
   - Parse job description text
   - Extract requirements, skills, responsibilities
   - Create embeddings for semantic matching
   - Structure requirements for gap analysis

3. **Evidence retrieval (pgvector)**
   - Semantic search for relevant resume sections
   - Match job requirements to resume content
   - Retrieve supporting evidence for claims
   - Rank relevance of experiences

4. **Resume synthesis (structured output)**
   - Reorder sections by relevance
   - Rewrite bullets to emphasize job-relevant aspects
   - Prioritize skills and projects
   - Generate ATS-friendly PDF

5. **Cover letter guidance generation**
   - Analyze job description and resume alignment
   - Generate structured outline
   - Provide talking points with evidence
   - Suggest tone and structure
   - Warn about unsupported claims

6. **PDF rendering service**
   - Generate professional resume PDF
   - Maintain ATS compatibility
   - Preserve formatting and structure

7. **Application workspace persistence**
   - Store job descriptions
   - Save tailored resume outputs
   - Persist cover letter guidance
   - Track gap analysis results
   - Maintain application state

### Database Schema (Future)

**New models needed:**
- `Application` — One workspace per job application
- `JobDescription` — Parsed and analyzed job posting
- `TailoredResume` — Generated resume for specific application
- `CoverLetterGuidance` — Structured guidance output
- `GapAnalysis` — Requirements analysis results
- `ApplicationNote` — Private coaching notes

**Existing models to leverage:**
- `DeveloperProfile` — User's base profile
- `ResumeChunk` — Existing resume content with embeddings
- `User` — Authentication and user management

---

## 🔌 API Design

### Endpoint Structure

**Base path:** `/applications`

#### Create Application Workspace
```
POST /applications/create
Body: {
  jobDescription: string
  jobTitle?: string
  companyName?: string
}
Response: {
  id: string
  jobDescription: string
  createdAt: string
  status: 'draft' | 'in_progress' | 'completed'
}
```

#### Generate Tailored Resume
```
POST /applications/:id/resume
Response: {
  resumeUrl: string  // URL to generated PDF
  changes: {
    sectionOrder: string[]
    rewrittenBullets: Array<{
      original: string
      tailored: string
      reason: string
    }>
    prioritizedSkills: string[]
  }
  notes: string[]  // Private coaching notes
}
```

#### Get Cover Letter Guidance
```
POST /applications/:id/cover-letter-guidance
Response: {
  outline: {
    opening: {
      angle: string
      suggestedApproach: string
    }
    body: Array<{
      paragraph: number
      purpose: string
      talkingPoints: string[]
      experiencesToReference: Array<{
        experience: string
        evidence: string  // Quote from resume
      }>
    }>
    closing: {
      suggestedApproach: string
      tone: string
    }
  }
  warnings: Array<{
    claim: string
    reason: string
    suggestion: string
  }>
  toneRecommendations: {
    level: 'formal' | 'professional' | 'conversational'
    reasoning: string
  }
}
```

#### Get Gap Analysis
```
GET /applications/:id/gap-analysis
Response: {
  stronglySupported: Array<{
    requirement: string
    evidence: string[]
    confidence: 'high'
  }>
  partiallySupported: Array<{
    requirement: string
    evidence: string[]
    missing: string[]
    confidence: 'medium'
    suggestions: string[]
  }>
  notPresent: Array<{
    requirement: string
    explanation: string
    addressInCoverLetter: boolean
    suggestion: string
  }>
}
```

#### Get Application State
```
GET /applications/:id
Response: {
  id: string
  jobDescription: string
  jobTitle?: string
  companyName?: string
  status: string
  resume?: {
    url: string
    generatedAt: string
  }
  coverLetterGuidance?: {
    generatedAt: string
  }
  gapAnalysis?: {
    generatedAt: string
  }
  notes: string[]
  createdAt: string
  updatedAt: string
}
```

### Authentication

- All endpoints require authentication
- User must have `DEVELOPER` role
- Applications are scoped to the authenticated user

---

## 📝 Development Principles

### Code Organization

1. **Module Structure**
   - `applications/` — New module for application workspace
   - `resume-synthesis/` — Resume tailoring service
   - `cover-letter/` — Cover letter guidance service
   - `gap-analysis/` — Gap analysis service
   - `pdf-renderer/` — PDF generation service

2. **Service Layer**
   - Each feature has a dedicated service
   - Services are testable and mockable
   - Business logic lives in services, not controllers

3. **DTOs and Validation**
   - All inputs validated with class-validator
   - Structured outputs with clear types
   - Error handling with proper HTTP status codes

### Error Handling

- Use NestJS exceptions (`NotFoundException`, `BadRequestException`, etc.)
- Provide clear error messages
- Log errors appropriately
- Never expose internal errors to users

### Testing Strategy

- Unit tests for services
- Integration tests for API endpoints
- Mock external dependencies (OpenAI, PDF generation)
- Test evidence-first principle (no invention)

### Performance Considerations

- Cache embeddings when possible (existing Redis integration)
- Use vector similarity search efficiently
- Batch operations where appropriate
- Consider async processing for PDF generation

---

## 🔄 Migration from Current State

### What to Keep

- ✅ Authentication system (JWT, OAuth)
- ✅ Developer profile management
- ✅ Resume ingestion and embedding pipeline
- ✅ Vector storage (pgvector)
- ✅ Redis caching

### What to Deprecate/Remove

- ❌ Recruiter chat endpoints (`/recruiter-chat/*`)
- ❌ Recruiter profile management (for MVP)
- ❌ Recruiter question tracking

### What to Build

- 🆕 Application workspace module
- 🆕 Job description parsing and analysis
- 🆕 Resume synthesis service
- 🆕 Cover letter guidance service
- 🆕 Gap analysis service
- 🆕 PDF rendering service
- 🆕 New database models for applications

---

## 📋 Checklist for New Features

When implementing any feature, ensure:

- [ ] Follows evidence-first principle
- [ ] Does not invent or exaggerate experience
- [ ] Provides guidance, not authoritative output
- [ ] User can override any suggestion
- [ ] All outputs traceable to source material
- [ ] Clear error handling
- [ ] Proper validation on inputs
- [ ] Tests written
- [ ] Documentation updated

---

## 🎓 Key Reminders

1. **We augment, we don't automate** — Users write their own content
2. **Evidence is king** — Never invent experience
3. **One application at a time** — MVP is focused
4. **Developer-facing** — Not recruiter-facing in MVP
5. **Clarity over scores** — No fake fit percentages
6. **Omission over invention** — Better to leave out than make up

---

**Last Updated:** [Date will be updated as project evolves]

**Version:** 1.0.0 (MVP Definition)
