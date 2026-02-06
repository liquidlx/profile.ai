export interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  requiredExperience: string[];
  preferredExperience: string[];
  keyQualifications: string[];
}

export interface ResumeSection {
  title: string;
  content: string[];
  order: number;
}

export interface TailoredResume {
  name: string;
  sections: ResumeSection[];
  skills: string[];
  summary?: string;
  changes: {
    sectionOrder: string[];
    rewrittenBullets: Array<{
      original: string;
      tailored: string;
      reason: string;
    }>;
    prioritizedSkills: string[];
  };
}
