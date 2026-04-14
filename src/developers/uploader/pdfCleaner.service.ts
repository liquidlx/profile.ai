import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PdfCleanerService {
  private readonly logger = new Logger(PdfCleanerService.name);

  /**
   * Clean text content to remove sensitive information
   */
  cleanTextContent(text: string): string {
    if (!text) return '';

    // Remove phone numbers (various formats)
    text = text.replace(
      /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      '[PHONE]',
    );

    // Remove email addresses
    text = text.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '[EMAIL]',
    );

    // Remove URLs
    text = text.replace(
      /\b(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
      '[URL]',
    );

    // Remove social media handles
    text = text.replace(/@[a-zA-Z0-9_]{1,15}/g, '[SOCIAL_MEDIA]');

    // Remove common address patterns
    text = text.replace(
      /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Terrace|Ter|Circle|Cir|Square|Sq)\b/g,
      '[ADDRESS]',
    );

    // Remove zip codes
    text = text.replace(/\b\d{5}(?:-\d{4})?\b/g, '[ZIP_CODE]');

    // Remove dates (various formats)
    text = text.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, '[DATE]');
    text = text.replace(
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
      '[DATE]',
    );

    // Remove credit card numbers (basic pattern)
    text = text.replace(
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      '[CREDIT_CARD]',
    );

    // Remove SSN patterns (basic)
    text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

    // Remove LinkedIn profile URLs
    text = text.replace(/linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/g, '[LINKEDIN]');

    // Remove GitHub profile URLs
    text = text.replace(/github\.com\/[a-zA-Z0-9-]+\/?/g, '[GITHUB]');

    // Remove personal website URLs
    text = text.replace(
      /\b(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/g,
      '[WEBSITE]',
    );

    // Remove excessive whitespace and normalize
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Get cleaning statistics
   */
  getCleaningStats(
    originalText: string,
    cleanedText: string,
  ): {
    originalLength: number;
    cleanedLength: number;
    reductionPercentage: number;
    removedItems: {
      phones: number;
      emails: number;
      urls: number;
      addresses: number;
    };
  } {
    const originalLength = originalText.length;
    const cleanedLength = cleanedText.length;
    const reductionPercentage =
      ((originalLength - cleanedLength) / originalLength) * 100;

    // Count removed items
    const phones = (
      originalText.match(
        /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      ) || []
    ).length;
    const emails = (
      originalText.match(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      ) || []
    ).length;
    const urls = (
      originalText.match(
        /\b(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
      ) || []
    ).length;
    const addresses = (
      originalText.match(
        /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Way|Terrace|Ter|Circle|Cir|Square|Sq)\b/g,
      ) || []
    ).length;

    return {
      originalLength,
      cleanedLength,
      reductionPercentage,
      removedItems: {
        phones,
        emails,
        urls,
        addresses,
      },
    };
  }
}
