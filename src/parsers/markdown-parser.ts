import { marked } from 'marked';
import matter from 'gray-matter';
import type { ParsedTemplate } from '../types/index.js';
import type { DocsRequest } from '../types/index.js';
import { getBrandColor, pointsToMagnitude, PELICAN_BRANDING } from '../branding/pelican-styles.js';

/**
 * Parse markdown template with front-matter and extract title
 */
export function parseMarkdownTemplate(markdown: string): ParsedTemplate {
  // Parse front matter if exists
  const { data, content } = matter(markdown);
  
  // Extract title from first H1
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] ?? 'Untitled Document';
  
  return {
    title,
    content,
    metadata: data as ParsedTemplate['metadata'],
  };
}

/**
 * Convert markdown content to Google Docs API requests
 * This inserts text and then applies formatting
 */
export function convertMarkdownToDocsRequests(
  markdown: string,
  replacements: Record<string, string> = {}
): DocsRequest[] {
  const requests: DocsRequest[] = [];
  
  // Replace placeholders first
  let processedMarkdown = markdown;
  for (const [placeholder, value] of Object.entries(replacements)) {
    processedMarkdown = processedMarkdown.replace(
      new RegExp(`\\[${placeholder}\\]`, 'g'),
      value
    );
  }
  
  // Tokenize the markdown
  const tokens = marked.lexer(processedMarkdown);
  
  // Start inserting content at index 1 (after logo)
  let currentIndex = 1;
  
  // Build text insertion requests first
  const textSegments: Array<{ text: string; startIndex: number; endIndex: number; type: string; level?: number; href?: string }> = [];
  
  for (const token of tokens) {
    if (token.type === 'heading') {
      const text = token.text + '\n';
      const startIndex = currentIndex;
      currentIndex += text.length;
      textSegments.push({ text, startIndex, endIndex: currentIndex, type: 'heading', level: token.depth });
      
      // Insert text
      requests.push({
        insertText: {
          location: { index: startIndex },
          text: text,
        },
      });
    } else if (token.type === 'paragraph') {
      const text = token.text + '\n\n';
      const startIndex = currentIndex;
      currentIndex += text.length;
      textSegments.push({ text, startIndex, endIndex: currentIndex, type: 'paragraph' });
      
      // Insert text
      requests.push({
        insertText: {
          location: { index: startIndex },
          text: text,
        },
      });
    } else if (token.type === 'list') {
      // Handle lists
      for (const item of token.items) {
        const text = '• ' + item.text + '\n';
        const startIndex = currentIndex;
        currentIndex += text.length;
        textSegments.push({ text, startIndex, endIndex: currentIndex, type: 'list-item' });
        
        requests.push({
          insertText: {
            location: { index: startIndex },
            text: text,
          },
        });
      }
      currentIndex += 1; // Add extra newline after list
      requests.push({
        insertText: {
          location: { index: currentIndex - 1 },
          text: '\n',
        },
      });
    } else if (token.type === 'code') {
      const text = token.text + '\n\n';
      const startIndex = currentIndex;
      currentIndex += text.length;
      textSegments.push({ text, startIndex, endIndex: currentIndex, type: 'code' });
      
      requests.push({
        insertText: {
          location: { index: startIndex },
          text: text,
        },
      });
    } else if (token.type === 'space') {
      // Skip extra spaces
      continue;
    }
  }
  
  // Now apply formatting
  for (const segment of textSegments) {
    if (segment.type === 'heading') {
      const level = segment.level || 1;
      let style;
      
      if (level === 1) {
        style = PELICAN_BRANDING.typography.h1;
      } else if (level === 2) {
        style = PELICAN_BRANDING.typography.h2;
      } else {
        style = PELICAN_BRANDING.typography.h3;
      }
      
      requests.push({
        updateParagraphStyle: {
          range: {
            startIndex: segment.startIndex,
            endIndex: segment.endIndex - 1,
          },
          paragraphStyle: {
            namedStyleType: level === 1 ? 'HEADING_1' : level === 2 ? 'HEADING_2' : 'HEADING_3',
          },
          fields: 'namedStyleType',
        },
      });
      
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: segment.startIndex,
            endIndex: segment.endIndex - 1,
          },
          textStyle: {
            foregroundColor: getBrandColor(style.color as keyof typeof PELICAN_BRANDING.colors),
            bold: style.bold,
            fontSize: pointsToMagnitude(style.size),
          },
          fields: 'foregroundColor,bold,fontSize',
        },
      });
    } else if (segment.type === 'code') {
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: segment.startIndex,
            endIndex: segment.endIndex - 1,
          },
          textStyle: {
            weightedFontFamily: {
              fontFamily: PELICAN_BRANDING.fonts.monospace,
            },
            fontSize: pointsToMagnitude(10),
            backgroundColor: getBrandColor('gray50'),
          },
          fields: 'weightedFontFamily,fontSize,backgroundColor',
        },
      });
    }
  }
  
  return requests;
}

