# Profile.AI

<div align="center">

**An AI-powered platform connecting developers and recruiters through intelligent resume analysis and semantic search**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

</div>

## 🚀 Overview

Profile.AI is a cutting-edge backend platform that revolutionizes how developers showcase their skills and how recruiters discover talent. By leveraging **vector embeddings**, **semantic search**, and **AI-powered chat**, the platform enables intelligent matching between developers and opportunities.

### Key Features

- 🤖 **AI-Powered Resume Analysis**: Automatically processes PDF resumes, extracts content, and creates semantic embeddings
- 🔍 **Vector Similarity Search**: Uses PostgreSQL with pgvector extension for fast, accurate semantic search
- 💬 **Intelligent Recruiter Chat**: AI assistant that answers questions about developers using RAG (Retrieval-Augmented Generation)
- 📄 **Smart Text Chunking**: Intelligent document chunking with overlap for optimal context preservation
- 🔐 **Multi-Authentication**: JWT-based auth with Google OAuth support
- 👥 **Role-Based Access**: Separate profiles for developers and recruiters
- ⚡ **Redis Caching**: High-performance caching layer for improved response times
- 🛡️ **Data Privacy**: Automatic PII (Personally Identifiable Information) removal from resumes

## 🏗️ Architecture

```
┌─────────────────┐
│   Developers    │
│   Upload PDFs   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  PDF Parser     │────▶│   Chunker    │────▶│ Embeddings  │
│  & Cleaner      │     │   Service    │     │   Service   │
└─────────────────┘     └──────────────┘     └──────┬──────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │  PostgreSQL +    │
                                            │   pgvector      │
                                            └────────┬────────┘
                                                     │
         ┌───────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Recruiters    │────▶│   Question   │────▶│   OpenAI    │
│   Ask Questions │     │  Embedding   │     │   GPT-3.5   │
└─────────────────┘     └──────────────┘     └─────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Vector Search   │
                    │ (Top 3 Chunks)  │
                    └─────────────────┘
```

## 🛠️ Tech Stack

### Core Framework
- **NestJS 11** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **Prisma** - Next-generation ORM

### Database & Storage
- **PostgreSQL 16** with **pgvector** - Vector similarity search
- **Redis** - Caching and session management

### AI & ML
- **OpenAI API** - Embeddings (text-embedding-3-small) and Chat (GPT-3.5-turbo)
- **TikToken** - Token counting for optimal chunking
- **PDF Parse** - Resume extraction

### Authentication
- **Passport.js** - Authentication middleware
- **JWT** - Token-based authentication
- **Google OAuth 2.0** - Social authentication

### Validation & Utilities
- **class-validator** - DTO validation
- **Zod** - Schema validation
- **Axios** - HTTP client

## 📋 Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **Docker** and **Docker Compose** (for local development)
- **OpenAI API Key** (for embeddings and chat)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/profile.ai.git
cd profile.ai
```

### 2. Install Dependencies

```bash
yarn install
# or
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/profile_ai?schema=public"
DATABASE_PORT=5432

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PORT=6379

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3003/auth/google/callback"

# Application
PORT=3003
FRONTEND_URL="http://localhost:3000"
```

### 4. Start Services with Docker

```bash
# Start PostgreSQL and Redis
yarn docker:up

# Or manually
docker-compose up -d
```

### 5. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Seed database (optional)
yarn db:seed

# Or reset and seed
yarn db:reset
```

### 6. Start Development Server

```bash
# Development mode with hot reload
yarn start:dev

# Or use the convenience script
yarn dev:start
```

The API will be available at `http://localhost:3003`

## 📚 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/profile` - Get current user profile

### Developers

- `POST /developers` - Create developer profile
- `GET /developers` - List all developers
- `GET /developers/:id` - Get developer by ID
- `GET /developers/slug/:slug` - Get developer by slug
- `GET /developers/my/profile` - Get current developer profile
- `PATCH /developers/:id` - Update developer profile
- `POST /developers/:developerId/upload-resume` - Upload and process PDF resume
- `DELETE /developers/:id` - Delete developer profile

### Recruiters

- `POST /recruiter-chat/:developerId/ask` - Ask AI question about developer

### Health

- `GET /` - Health check endpoint

## 🔧 Development Scripts

```bash
# Development
yarn start:dev          # Start in watch mode
yarn start:debug        # Start in debug mode
yarn start:prod         # Start in production mode

# Database
yarn db:seed            # Seed database
yarn db:reset           # Reset and seed database

# Docker
yarn docker:up          # Start services
yarn docker:down        # Stop services
yarn docker:restart     # Restart services
yarn docker:logs       # View logs
yarn docker:clean      # Remove volumes

# Testing
yarn test               # Run unit tests
yarn test:watch         # Run tests in watch mode
yarn test:cov           # Run tests with coverage
yarn test:e2e           # Run end-to-end tests

# Code Quality
yarn lint               # Lint code
yarn format             # Format code
```

## 🧠 How It Works

### Resume Processing Pipeline

1. **Upload**: Developer uploads a PDF resume
2. **Extraction**: PDF is parsed to extract text content
3. **Cleaning**: PII (emails, phones, addresses) is automatically removed
4. **Chunking**: Text is intelligently chunked using token-based segmentation with overlap
5. **Embedding**: Each chunk is converted to a 1536-dimensional vector using OpenAI
6. **Storage**: Chunks and embeddings are stored in PostgreSQL with pgvector

### Recruiter Question Flow

1. **Question**: Recruiter asks a question about a developer
2. **Embedding**: Question is converted to a vector embedding
3. **Search**: Vector similarity search finds top 3 most relevant resume chunks
4. **Context**: Developer profile + relevant chunks are assembled
5. **Generation**: OpenAI GPT-3.5 generates an answer using RAG
6. **Response**: Answer is returned to the recruiter

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Vector search powered by [pgvector](https://github.com/pgvector/pgvector)
- AI capabilities by [OpenAI](https://openai.com/)

---

<div align="center">

Made with ❤️ for a developer to developers

**Profile.AI** - Where AI meets talent discovery

</div>
