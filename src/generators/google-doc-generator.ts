import { google } from 'googleapis';
import fs from 'fs/promises';
import { getAuthClient } from '../auth/google-auth.js';
import { parseMarkdownTemplate, convertMarkdownToDocsRequests } from '../parsers/markdown-parser.js';
import { PELICAN_BRANDING } from '../branding/pelican-styles.js';
import type { GenerateDocOptions, DocsRequest } from '../types/index.js';

/**
 * Generate a Google Doc from a markdown template (Framework documents)
 */
export async function generateFrameworkDoc(options: GenerateDocOptions): Promise<string> {
  const auth = await getAuthClient();
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });
  
  // 1. Read and parse markdown template
  const markdown = await fs.readFile(options.templatePath, 'utf-8');
  const { title, content } = parseMarkdownTemplate(markdown);
  
  // 2. Create new Google Doc
  const createResponse = await docs.documents.create({
    requestBody: {
      title: `${title} - Pelican AI`,
    },
  });
  
  const documentId = createResponse.data.documentId;
  if (!documentId) {
    throw new Error('Failed to create document - no documentId returned');
  }
  
  // 3. Build batch update requests
  const requests: DocsRequest[] = [];
  
  // Add Pelican logo at top
  requests.push({
    insertInlineImage: {
      uri: PELICAN_BRANDING.logo.url,
      location: { index: 1 },
      objectSize: {
        height: { magnitude: PELICAN_BRANDING.logo.height, unit: 'PT' },
        width: { magnitude: PELICAN_BRANDING.logo.width, unit: 'PT' },
      },
    },
  });
  
  // Add a line break after logo
  requests.push({
    insertText: {
      location: { index: 1 },
      text: '\n\n',
    },
  });
  
  // Convert markdown content to Docs requests
  const replacements: Record<string, string> = {};
  if (options.surveyUrl) {
    replacements['Survey Link'] = options.surveyUrl;
    replacements['Insert link when created'] = options.surveyUrl;
  }
  
  const contentRequests = convertMarkdownToDocsRequests(content, replacements);
  requests.push(...contentRequests);
  
  // 4. Execute batch update
  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }
  
  // 5. Set sharing to "Anyone with link can view"
  await drive.permissions.create({
    fileId: documentId,
    requestBody: {
      type: 'anyone',
      role: 'reader',
    },
  });
  
  return `https://docs.google.com/document/d/${documentId}/edit`;
}

/**
 * Generate Welcome Kit document with multiple embedded links
 */
export async function generateWelcomeKit(options: GenerateDocOptions): Promise<string> {
  const auth = await getAuthClient();
  const docs = google.docs({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });
  
  // 1. Read and parse markdown template
  const markdown = await fs.readFile(options.templatePath, 'utf-8');
  const { title, content } = parseMarkdownTemplate(markdown);
  
  // 2. Create new Google Doc
  const createResponse = await docs.documents.create({
    requestBody: {
      title: `${title} - Pelican AI`,
    },
  });
  
  const documentId = createResponse.data.documentId;
  if (!documentId) {
    throw new Error('Failed to create document - no documentId returned');
  }
  
  // 3. Build batch update requests
  const requests: DocsRequest[] = [];
  
  // Add Pelican logo at top
  requests.push({
    insertInlineImage: {
      uri: PELICAN_BRANDING.logo.url,
      location: { index: 1 },
      objectSize: {
        height: { magnitude: PELICAN_BRANDING.logo.height, unit: 'PT' },
        width: { magnitude: PELICAN_BRANDING.logo.width, unit: 'PT' },
      },
    },
  });
  
  // Add line breaks after logo
  requests.push({
    insertText: {
      location: { index: 1 },
      text: '\n\n',
    },
  });
  
  // Prepare link replacements
  const replacements: Record<string, string> = {};
  if (options.frameworkUrl) {
    replacements['Insert link to Lesson Objective Unpacker Google Doc'] = options.frameworkUrl;
  }
  if (options.postFrameworkSurveyUrl) {
    replacements['Insert link when created'] = options.postFrameworkSurveyUrl;
  }
  if (options.weeklyCheckinUrl) {
    replacements['Insert link when created'] = options.weeklyCheckinUrl;
  }
  
  // Convert markdown content to Docs requests
  const contentRequests = convertMarkdownToDocsRequests(content, replacements);
  requests.push(...contentRequests);
  
  // 4. Execute batch update
  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    });
  }
  
  // 5. Set sharing to "Anyone with link can view"
  await drive.permissions.create({
    fileId: documentId,
    requestBody: {
      type: 'anyone',
      role: 'reader',
    },
  });
  
  return `https://docs.google.com/document/d/${documentId}/edit`;
}

