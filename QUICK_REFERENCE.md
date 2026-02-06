# Profile.AI — Quick Reference Guide

> **Quick lookup for product principles and technical guidelines**

## 🎯 Core Mission

**AI-assisted application toolkit** — Helps developers apply to jobs with clarity, relevance, and honesty. **Augmentation, not automation.**

## 🚫 Hard Boundaries

- ❌ No auto-writing cover letters
- ❌ No inventing experience
- ❌ No recruiter-facing features (MVP)
- ❌ No mass application tools
- ❌ No fake fit scores

## ✅ MVP Features

1. **Job-Tailored Resume** — Reorder, rewrite, prioritize (evidence-only)
2. **Cover Letter Guidance** — Outlines, talking points, warnings (user writes)
3. **Gap Analysis** — Clear requirements mapping (no scores)
4. **Application Notes** — Private coaching hints
5. **One-Application Workspace** — Single job focus

## 🤖 AI Rules

### DO ✅
- Reorder existing content
- Rewrite bullets for relevance
- Provide structured guidance
- Warn about unsupported claims
- Suggest omissions

### DON'T ❌
- Add new experiences
- Invent achievements
- Write full cover letters
- Create fit scores
- Exaggerate responsibilities

## 🏗️ Technical Stack

- **Framework:** NestJS 11 + TypeScript
- **Database:** PostgreSQL + pgvector
- **Cache:** Redis
- **AI:** OpenAI (embeddings + GPT)
- **ORM:** Prisma

## 🔌 Key Endpoints (Planned)

```
POST /applications/create
POST /applications/:id/resume
POST /applications/:id/cover-letter-guidance
GET  /applications/:id/gap-analysis
GET  /applications/:id
```

## 📦 New Modules Needed

- `applications/` — Workspace management
- `resume-synthesis/` — Resume tailoring
- `cover-letter/` — Guidance generation
- `gap-analysis/` — Requirements analysis
- `pdf-renderer/` — PDF generation

## 🔄 Migration Notes

**Keep:**
- Auth system
- Developer profiles
- Resume ingestion pipeline
- Vector storage
- Redis caching

**Remove (MVP):**
- Recruiter chat
- Recruiter profiles

**Build:**
- Application workspace
- Job description analysis
- Resume synthesis
- Cover letter guidance
- Gap analysis
- PDF rendering

## ⚡ Quick Checks

Before implementing any feature:
- [ ] Evidence-first?
- [ ] No invention?
- [ ] User can override?
- [ ] Guidance, not authority?
- [ ] Tests written?

---

**See `PRODUCT_GUIDE.md` for full details.**
