# Database Seeding

This directory contains the database seeding script for local development and testing.

## Overview

The seed script (`seed.ts`) populates your local database with sample data including:

- **8 Users** (5 developers, 3 recruiters)
- **5 Developer Profiles** with realistic data
- **3 Recruiter Profiles** from different companies
- **5 Sample Recruiter Questions** with answers

## Prerequisites

1. Make sure your database is running and accessible
2. Ensure your `.env` file has the correct `DATABASE_URL`
3. Run database migrations: `npx prisma migrate dev`

## Running the Seed Script

### Option 1: Using npm scripts (Recommended)

```bash
# Seed the database with sample data
npm run db:seed

# Reset database and seed (drops all data and recreates)
npm run db:reset
```

### Option 2: Direct execution

```bash
# Using ts-node
npx ts-node prisma/seed.ts

# Or if you have ts-node installed globally
ts-node prisma/seed.ts
```

## Test Credentials

After running the seed script, you can use these credentials to test the application:

### Developer Accounts

- **Email:** john.doe@example.com | **Password:** password123
- **Email:** sarah.smith@example.com | **Password:** password123
- **Email:** mike.chen@example.com | **Password:** password123
- **Email:** emma.wilson@example.com | **Password:** password123
- **Email:** alex.rodriguez@example.com | **Password:** password123

### Recruiter Accounts

- **Email:** hr@techcorp.com | **Password:** password123
- **Email:** talent@startup.io | **Password:** password123
- **Email:** recruiter@bigtech.com | **Password:** password123

## Sample Data Details

### Developer Profiles

1. **John Doe** - Full-stack developer (React, Node.js, TypeScript)
2. **Sarah Smith** - Frontend specialist (React, Vue.js, CSS)
3. **Mike Chen** - Backend engineer (Python, Go, Microservices)
4. **Emma Wilson** - Mobile developer (React Native, Swift, Kotlin)
5. **Alex Rodriguez** - DevOps engineer (Docker, Kubernetes, AWS)

### Recruiter Profiles

1. **TechCorp Inc.** - Senior Talent Acquisition Specialist
2. **Startup.io** - Technical Recruiter
3. **BigTech Solutions** - Engineering Recruiter

### Sample Questions

The seed script creates realistic Q&A pairs between developers and recruiters covering topics like:

- Microservices architecture
- State management in React
- Responsive design approaches
- Database optimization
- Mobile app deployment

## Notes

- **Resume Chunks**: Due to the vector field limitations in Prisma, resume chunks are not created via the seed script. They will be generated when developers upload their resumes through the API.
- **Profile Pictures**: All users have sample profile pictures from Unsplash
- **CV URLs**: Sample CV URLs are provided but point to non-existent files

## Customization

You can modify the `seed.ts` file to:

- Add more users and profiles
- Change the sample data
- Add different types of test data
- Modify the password for all users

## Troubleshooting

### Common Issues

1. **Database connection error**: Ensure your database is running and `DATABASE_URL` is correct
2. **Migration errors**: Run `npx prisma migrate dev` first
3. **Permission errors**: Make sure you have write access to the database
4. **TypeScript errors**: Ensure all dependencies are installed

### Reset Everything

If you need to start fresh:

```bash
# Reset database, run migrations, and seed
npm run db:reset

# Or manually:
npx prisma migrate reset
npm run db:seed
```

## Development Workflow

1. **Initial Setup**: Run `npm run db:reset` to set up the database
2. **During Development**: Use `npm run db:seed` to add sample data
3. **Testing**: Use the provided test credentials to test different user roles
4. **Reset**: Use `npm run db:reset` when you need a clean slate
