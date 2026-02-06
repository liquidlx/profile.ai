import { Injectable, Logger } from '@nestjs/common';
import { TailoredResume } from './types';

type PDFKit = typeof import('pdfkit');

// PDFKit is a CommonJS module, use require for proper compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as PDFKit;

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Sanitizes a filename to be ATS-friendly
   * Removes special characters, replaces spaces with underscores, limits length
   */
  sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
  }

  /**
   * Normalizes section headers to ATS-friendly standard names
   */
  private normalizeSectionHeader(header: string): string {
    const normalized: string = header.toLowerCase().trim();
    const ATS_SECTION_MAP: Record<string, string> = {
      'work experience': 'Experience',
      employment: 'Experience',
      'professional experience': 'Experience',
      experience: 'Experience',
      education: 'Education',
      'academic background': 'Education',
      academic: 'Education',
      skills: 'Skills',
      'technical skills': 'Skills',
      'core competencies': 'Skills',
      competencies: 'Skills',
      projects: 'Projects',
      portfolio: 'Projects',
      certifications: 'Certifications',
      certificates: 'Certifications',
      certificate: 'Certifications',
    };

    return ATS_SECTION_MAP[normalized] || header;
  }

  /**
   * Normalizes date formats to ATS-friendly format: MM/YYYY - MM/YYYY or MM/YYYY - Present
   */
  private normalizeDateFormat(dateString: string): string {
    // Normalize "PRESENT", "Now", "Current" to "Present"
    const normalized = dateString
      .replace(/\b(PRESENT|NOW|CURRENT)\b/gi, 'Present')
      .trim();

    // Try to standardize date format to MM/YYYY - MM/YYYY or MM/YYYY - Present
    // Pattern: MM/YYYY - MM/YYYY or MM/YYYY - Present
    const datePattern =
      /(\d{1,2}\/\d{4}|\d{4})\s*[-–—]\s*(\d{1,2}\/\d{4}|\d{4}|\bPresent\b)/i;
    const match = normalized.match(datePattern);

    if (match) {
      const startDate = match[1];
      const endDate = match[2];

      // Normalize start date to MM/YYYY if it's YYYY
      let normalizedStart = startDate;
      if (/^\d{4}$/.test(startDate)) {
        normalizedStart = `01/${startDate}`;
      } else if (/^\d{1}\/\d{4}$/.test(startDate)) {
        normalizedStart = `0${startDate}`;
      }

      // Normalize end date
      let normalizedEnd = endDate;
      if (endDate.toLowerCase() === 'present') {
        normalizedEnd = 'Present';
      } else if (/^\d{4}$/.test(endDate)) {
        normalizedEnd = `01/${endDate}`;
      } else if (/^\d{1}\/\d{4}$/.test(endDate)) {
        normalizedEnd = `0${endDate}`;
      }

      return `${normalizedStart} - ${normalizedEnd}`;
    }

    return normalized;
  }

  private renderExperienceSection(doc: PDFKit, content: string[]): void {
    let currentJobEntry: {
      dates?: string;
      title?: string;
      company?: string;
      achievements: string[];
    } = { achievements: [] };

    // Flatten content array and split by newlines
    const allLines: string[] = [];
    for (const item of content) {
      const lines = item
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      allLines.push(...lines);
    }

    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].trim();
      if (line.length === 0) continue;

      // Check if this line contains dates (job header line)
      // Pattern: MM/YYYY - MM/YYYY or MM/YYYY - PRESENT
      const datePattern =
        /(\d{2}\/\d{4}|\d{4})\s*-\s*(\d{2}\/\d{4}|\d{4}|\bPRESENT\b)/i;
      const dateMatch = line.match(datePattern);

      if (dateMatch) {
        // This is likely a job header line
        if (currentJobEntry.dates || currentJobEntry.achievements.length > 0) {
          // Render the previous job entry before starting a new one
          this.renderJobEntry(doc, currentJobEntry);
          currentJobEntry = { achievements: [] };
        }

        // Extract and normalize dates
        currentJobEntry.dates = this.normalizeDateFormat(dateMatch[0]);

        // Try to extract title and company from the rest of the line
        const restOfLine = line.replace(datePattern, '').trim();
        if (restOfLine.length > 0) {
          // Look for common separators: comma, dash, or "at"
          const parts = restOfLine.split(/,\s*|\s+at\s+/i);
          if (parts.length >= 2) {
            currentJobEntry.title = parts[0].trim();
            currentJobEntry.company = parts.slice(1).join(', ').trim();
          } else {
            // If no clear separator, treat the whole thing as title
            currentJobEntry.title = restOfLine;
          }
        }
      } else if (currentJobEntry.dates) {
        // This is an achievement line (bullet point)
        // Remove existing bullet characters if present
        const cleanLine = line.replace(/^[•\-*]\s*/, '');
        if (cleanLine.length > 0) {
          currentJobEntry.achievements.push(cleanLine);
        }
      } else {
        // No dates found yet, might be a title/company line
        // Check if it looks like a job title
        const hasJobTitle =
          line.includes('Engineer') ||
          line.includes('Developer') ||
          line.includes('Manager') ||
          line.includes('Lead') ||
          line.includes('Architect') ||
          line.includes('Analyst') ||
          line.includes('Designer');

        if (hasJobTitle && !currentJobEntry.title) {
          // This might be a title line (dates might be on next line or previous)
          const parts = line.split(/,\s*|\s+at\s+/i);
          if (parts.length >= 2) {
            currentJobEntry.title = parts[0].trim();
            currentJobEntry.company = parts.slice(1).join(', ').trim();
          } else {
            currentJobEntry.title = line;
          }
        } else if (currentJobEntry.title && !currentJobEntry.company) {
          // This might be the company line
          currentJobEntry.company = line;
        } else {
          // Treat as achievement
          const cleanLine = line.replace(/^[•\-*]\s*/, '');
          if (cleanLine.length > 0) {
            currentJobEntry.achievements.push(cleanLine);
          }
        }
      }
    }

    // Render the last job entry
    if (currentJobEntry.dates || currentJobEntry.achievements.length > 0) {
      this.renderJobEntry(doc, currentJobEntry);
    }
  }

  private renderJobEntry(
    doc: PDFKit,
    entry: {
      dates?: string;
      title?: string;
      company?: string;
      achievements: string[];
    },
  ): void {
    // Render dates (if available)
    if (entry.dates) {
      doc.fontSize(10).font('Helvetica-Bold').text(entry.dates, {
        align: 'left',
        width: 500,
      });
    }

    // Render title and company with em dash separator (ATS-friendly)
    const titleCompanyParts: string[] = [];
    if (entry.title) {
      titleCompanyParts.push(entry.title);
    }
    if (entry.company) {
      titleCompanyParts.push(entry.company);
    }

    if (titleCompanyParts.length > 0) {
      // Use em dash (—) for ATS-friendly separation
      const separator = titleCompanyParts.length === 2 ? ' — ' : ', ';
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(titleCompanyParts.join(separator), {
          align: 'left',
          width: 500,
        });
    }

    doc.moveDown(0.2);

    // Render achievements with proper bullets, each on a new line
    doc.fontSize(10).font('Helvetica');
    for (const achievement of entry.achievements) {
      doc.text(`- ${achievement}`, {
        align: 'left',
        width: 500,
        indent: 15,
      });
      doc.moveDown(0.15);
    }

    doc.moveDown(0.3);
  }

  async generateResumePDF(
    tailoredResume: TailoredResume,
    jobTitle?: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        // Set ATS-friendly PDF metadata
        const pdfTitle = jobTitle
          ? `${tailoredResume.name} - ${jobTitle} Resume`
          : `${tailoredResume.name} Resume`;
        // PDFKit metadata is set via the info property
        // Include CreationDate and ModDate as Date objects to avoid errors
        const now = new Date();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (doc as any).info = {
          Title: pdfTitle,
          Author: tailoredResume.name,
          Subject: 'Resume',
          Creator: 'Profile.AI',
          CreationDate: now,
          ModDate: now,
        };

        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (error) => {
          this.logger.error('Failed to generate PDF:', error);
          reject(new Error('Failed to generate PDF'));
        });

        // Header - Name
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text(tailoredResume.name, { align: 'center' })
          .moveDown(0.5);

        // Summary (if present)
        if (tailoredResume.summary) {
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(tailoredResume.summary, {
              align: 'left',
              width: 500,
            })
            .moveDown(0.5);
        }

        // Skills section (only show once at the top)
        if (tailoredResume.skills.length > 0) {
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Skills', { underline: true })
            .moveDown(0.3);

          doc
            .fontSize(10)
            .font('Helvetica')
            .text(tailoredResume.skills.join(', '), {
              align: 'left',
              width: 500,
            })
            .moveDown(0.5);
        }

        // Sections (filter out Skills section to avoid duplication)
        const sortedSections = [...tailoredResume.sections]
          .filter((section) => section.title.toLowerCase() !== 'skills')
          .sort((a, b) => a.order - b.order);

        for (const section of sortedSections) {
          // Normalize section header to ATS-friendly standard
          const normalizedTitle = this.normalizeSectionHeader(section.title);

          // Section title
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(normalizedTitle, { underline: true })
            .moveDown(0.3);

          doc.fontSize(10).font('Helvetica');

          // Special handling for Experience section
          if (normalizedTitle.toLowerCase() === 'experience') {
            this.renderExperienceSection(doc, section.content);
          } else {
            // Regular section content (bullets)
            for (const bullet of section.content) {
              // Use a simple bullet character that works in PDFKit
              doc.text(`- ${bullet}`, {
                align: 'left',
                width: 500,
                indent: 10,
              });
              doc.moveDown(0.2);
            }
          }

          doc.moveDown(0.5);
        }

        // Finalize PDF
        doc.end();
      } catch (error) {
        this.logger.error('Failed to generate PDF:', error);
        reject(new Error('Failed to generate PDF'));
      }
    });
  }
}
