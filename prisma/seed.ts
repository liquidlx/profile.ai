import { PrismaClient, UserRole } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.recruiterQuestion.deleteMany();
  await prisma.resumeChunk.deleteMany();
  await prisma.developerProfile.deleteMany();
  await prisma.recruiterProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  console.log('👥 Creating sample users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    // Developer users
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        profilePic:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah.smith@example.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        profilePic:
          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.chen@example.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        profilePic:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma.wilson@example.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        profilePic:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'alex.rodriguez@example.com',
        password: hashedPassword,
        role: UserRole.DEVELOPER,
        profilePic:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      },
    }),

    // Recruiter users
    prisma.user.create({
      data: {
        email: 'hr@techcorp.com',
        password: hashedPassword,
        role: UserRole.RECRUITER,
        profilePic:
          'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'talent@startup.io',
        password: hashedPassword,
        role: UserRole.RECRUITER,
        profilePic:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'recruiter@bigtech.com',
        password: hashedPassword,
        role: UserRole.RECRUITER,
        profilePic:
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create developer profiles
  console.log('👨‍💻 Creating developer profiles...');

  const developerProfiles = await Promise.all([
    prisma.developerProfile.create({
      data: {
        userId: users[0].id,
        slug: 'john-doe',
        name: 'John Doe',
        bio: 'Full-stack developer with 5+ years of experience building scalable web applications. Passionate about clean code and user experience.',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        cvUrl: 'https://example.com/cv/john-doe.pdf',
        allowDownload: true,
        summary:
          'Experienced full-stack developer specializing in React, Node.js, and TypeScript. Led development of multiple production applications serving thousands of users.',
        keySkills: 'React, Node.js, TypeScript, PostgreSQL, AWS, Docker, Git',
      },
    }),
    prisma.developerProfile.create({
      data: {
        userId: users[1].id,
        slug: 'sarah-smith',
        name: 'Sarah Smith',
        bio: 'Frontend specialist with expertise in modern JavaScript frameworks and responsive design. Love creating intuitive user interfaces.',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        cvUrl: 'https://example.com/cv/sarah-smith.pdf',
        allowDownload: false,
        summary:
          'Frontend developer with 3 years of experience in React, Vue.js, and modern CSS. Focused on creating accessible and performant web applications.',
        keySkills: 'React, Vue.js, JavaScript, CSS3, HTML5, Webpack, Jest',
      },
    }),
    prisma.developerProfile.create({
      data: {
        userId: users[2].id,
        slug: 'mike-chen',
        name: 'Mike Chen',
        bio: 'Backend engineer with strong focus on system architecture and performance optimization. Experience with microservices and cloud platforms.',
        avatarUrl:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        cvUrl: 'https://example.com/cv/mike-chen.pdf',
        allowDownload: true,
        summary:
          'Senior backend engineer with 7+ years building high-performance systems. Expert in Python, Go, and distributed systems.',
        keySkills:
          'Python, Go, PostgreSQL, Redis, Docker, Kubernetes, AWS, Microservices',
      },
    }),
    prisma.developerProfile.create({
      data: {
        userId: users[3].id,
        slug: 'emma-wilson',
        name: 'Emma Wilson',
        bio: 'Mobile app developer with experience in both iOS and Android development. Passionate about creating smooth, native mobile experiences.',
        avatarUrl:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        cvUrl: 'https://example.com/cv/emma-wilson.pdf',
        allowDownload: true,
        summary:
          'Mobile developer with 4 years of experience in React Native, Swift, and Kotlin. Published multiple apps with millions of downloads.',
        keySkills:
          'React Native, Swift, Kotlin, iOS, Android, Firebase, App Store, Google Play',
      },
    }),
    prisma.developerProfile.create({
      data: {
        userId: users[4].id,
        slug: 'alex-rodriguez',
        name: 'Alex Rodriguez',
        bio: 'DevOps engineer with expertise in CI/CD, infrastructure automation, and cloud security. Love optimizing development workflows.',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        cvUrl: 'https://example.com/cv/alex-rodriguez.pdf',
        allowDownload: false,
        summary:
          'DevOps engineer with 6 years of experience in automation, cloud infrastructure, and security. Reduced deployment time by 80%.',
        keySkills:
          'Docker, Kubernetes, AWS, Terraform, Jenkins, GitLab CI, Linux, Bash',
      },
    }),
  ]);

  console.log(`✅ Created ${developerProfiles.length} developer profiles`);

  // Create recruiter profiles
  console.log('👔 Creating recruiter profiles...');

  const recruiterProfiles = await Promise.all([
    prisma.recruiterProfile.create({
      data: {
        userId: users[5].id,
        company: 'TechCorp Inc.',
        position: 'Senior Talent Acquisition Specialist',
        bio: 'Hiring top tech talent for a fast-growing SaaS company. Looking for developers who are passionate about innovation.',
      },
    }),
    prisma.recruiterProfile.create({
      data: {
        userId: users[6].id,
        company: 'Startup.io',
        position: 'Technical Recruiter',
        bio: 'Building the next generation of tech products. Seeking developers who thrive in fast-paced, collaborative environments.',
      },
    }),
    prisma.recruiterProfile.create({
      data: {
        userId: users[7].id,
        company: 'BigTech Solutions',
        position: 'Engineering Recruiter',
        bio: 'Leading technology company seeking exceptional engineers to solve complex problems at scale.',
      },
    }),
  ]);

  console.log(`✅ Created ${recruiterProfiles.length} recruiter profiles`);

  // Create sample recruiter questions
  console.log('❓ Creating sample recruiter questions...');

  const sampleQuestions = [
    {
      developerId: developerProfiles[0].id,
      recruiterId: recruiterProfiles[0].id,
      question: 'What experience do you have with microservices architecture?',
      answer:
        "I have 3 years of experience designing and implementing microservices using Docker and Kubernetes. I've worked on systems that handle millions of requests per day.",
    },
    {
      developerId: developerProfiles[0].id,
      recruiterId: recruiterProfiles[1].id,
      question:
        'How do you handle state management in large React applications?',
      answer:
        'I prefer using Redux Toolkit for complex state management, combined with React Query for server state. For simpler apps, I use Zustand or Context API.',
    },
    {
      developerId: developerProfiles[1].id,
      recruiterId: recruiterProfiles[0].id,
      question: "What's your approach to responsive design?",
      answer:
        'I use CSS Grid and Flexbox for layouts, with mobile-first design principles. I also implement progressive enhancement and ensure accessibility standards.',
    },
    {
      developerId: developerProfiles[2].id,
      recruiterId: recruiterProfiles[2].id,
      question: 'How do you optimize database performance?',
      answer:
        'I focus on proper indexing, query optimization, and caching strategies. I use Redis for caching and implement database connection pooling.',
    },
    {
      developerId: developerProfiles[3].id,
      recruiterId: recruiterProfiles[1].id,
      question: "What's your experience with mobile app deployment?",
      answer:
        'I have experience deploying to both App Store and Google Play. I use Fastlane for automated deployment and implement proper CI/CD pipelines.',
    },
  ];

  const recruiterQuestions = await Promise.all(
    sampleQuestions.map((q) =>
      prisma.recruiterQuestion.create({
        data: q,
      }),
    ),
  );

  console.log(`✅ Created ${recruiterQuestions.length} recruiter questions`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- ${users.length} users created`);
  console.log(`- ${developerProfiles.length} developer profiles created`);
  console.log(`- ${recruiterProfiles.length} recruiter profiles created`);
  console.log(`- ${recruiterQuestions.length} recruiter questions created`);
  console.log(
    '\n📝 Note: Resume chunks are not created via seed due to vector field limitations.',
  );
  console.log(
    '   They will be created when developers upload their resumes through the API.',
  );

  console.log('\n🔑 Test Credentials:');
  console.log('Developer accounts:');
  console.log('- john.doe@example.com / password123');
  console.log('- sarah.smith@example.com / password123');
  console.log('- mike.chen@example.com / password123');
  console.log('- emma.wilson@example.com / password123');
  console.log('- alex.rodriguez@example.com / password123');
  console.log('\nRecruiter accounts:');
  console.log('- hr@techcorp.com / password123');
  console.log('- talent@startup.io / password123');
  console.log('- recruiter@bigtech.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
