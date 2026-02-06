import { Injectable } from '@nestjs/common';
import { encoding_for_model, Tiktoken } from '@dqbd/tiktoken';

@Injectable()
export class ChunkerService {
  private readonly tokenizer: Tiktoken;

  private readonly targetTokensPerChunk = 200;
  private readonly overlapTokens = 100;

  constructor() {
    this.tokenizer = encoding_for_model('text-embedding-3-small');
  }

  public chunkText(rawText: string): string[] {
    const paragraphs = this.splitIntoParagraphs(rawText);
    const chunks: string[] = [];

    let currentChunk: string[] = [];
    let currentTokenCount = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const numTokens = this.countTokens(paragraph);

      if (currentTokenCount + numTokens <= this.targetTokensPerChunk) {
        currentChunk.push(paragraph);
        currentTokenCount += numTokens;
      } else {
        // Store current chunk
        chunks.push(currentChunk.join('\n\n'));

        // Build overlap for next chunk
        const overlap = this.getLastOverlap(currentChunk);
        currentChunk = [...overlap, paragraph];
        currentTokenCount = this.countTokensFromParagraphs(currentChunk);
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
    }

    return chunks;
  }

  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n{2,}/) // Split on multiple newlines
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }

  private countTokens(text: string): number {
    const tokens = this.tokenizer.encode(text);
    return tokens.length;
  }

  private countTokensFromParagraphs(paragraphs: string[]): number {
    return paragraphs.reduce((acc, p) => acc + this.countTokens(p), 0);
  }

  private getLastOverlap(paragraphs: string[]): string[] {
    const overlap: string[] = [];
    let totalTokens = 0;

    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const paragraph = paragraphs[i];
      const numTokens = this.countTokens(paragraph);

      totalTokens += numTokens;
      overlap.unshift(paragraph);

      if (totalTokens >= this.overlapTokens) {
        break;
      }
    }
    return overlap;
  }
}
