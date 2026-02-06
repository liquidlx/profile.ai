# Profile.AI - Status Overview

> **Product Pivot**: Transitioning from recruiter-facing chat to developer-facing application toolkit.
> See `PRODUCT_GUIDE.md` for full product vision and `QUICK_REFERENCE.md` for quick lookup.

## ✅ Production Ready (Reusable)

- **Authentication**: JWT login/register, profile endpoint, token refresh
- **Developer Profiles**: Full CRUD (create, read, update, delete, list, slug lookup)
- **Resume Processing**: PDF parsing, PII removal, intelligent chunking, embedding generation
- **Vector Storage**: PostgreSQL + pgvector for semantic search
- **Redis Caching**: Embedding caching for performance
- **Role-Based Access**: Guards and decorators for DEVELOPER/RECRUITER roles
- **Database**: Prisma schema, migrations, seed data

## 🚧 In Progress / Partially Ready

- **Google OAuth**: Strategy implemented but marked as TODO, endpoints exist
- **Resume Summary & Skills**: Extraction logic commented out (TODO in code)

## 🆕 To Build (MVP)

### Core Application Features
- **Application Workspace**: Create and manage job application workspaces
- **Job Description Analysis**: Parse and analyze job postings, extract requirements
- **Resume Synthesis Service**: Tailor resumes by reordering, rewriting bullets, prioritizing skills
- **Cover Letter Guidance**: Generate structured outlines, talking points, warnings (not full text)
- **Gap Analysis**: Map job requirements to resume, identify gaps honestly
- **PDF Rendering**: Generate ATS-friendly tailored resume PDFs
- **Application Notes**: Private coaching hints for users

### Database Schema
- **Application Model**: Workspace for each job application
- **JobDescription Model**: Parsed job posting data
- **TailoredResume Model**: Generated resume outputs
- **CoverLetterGuidance Model**: Guidance structure
- **GapAnalysis Model**: Requirements analysis results

### API Endpoints
- `POST /applications/create` - Create application workspace
- `POST /applications/:id/resume` - Generate tailored resume
- `POST /applications/:id/cover-letter-guidance` - Get guidance
- `GET /applications/:id/gap-analysis` - Get gap analysis
- `GET /applications/:id` - Get full application state

## 🗑️ To Deprecate (MVP)

- **Recruiter Chat**: `/recruiter-chat/*` endpoints (not needed for MVP)
- **Recruiter Profile Management**: Not needed for developer-focused MVP
- **Recruiter Question Tracking**: Analytics not needed for MVP

## ❌ Missing / Technical Debt

- **CV File Storage**: cvUrl field exists but no actual file upload/storage service
- **Testing**: Test infrastructure mentioned but needs verification
- **Error Handling**: Some services use generic Error instead of NestJS exceptions
- **Application Persistence**: No models or services for application workspaces yet