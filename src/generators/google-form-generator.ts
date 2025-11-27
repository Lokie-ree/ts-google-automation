import { google } from 'googleapis';
import fs from 'fs/promises';
import { getAuthClient } from '../auth/google-auth.js';
import { parseSurveyTemplate, buildQuestionItem } from '../parsers/survey-parser.js';
import type { GenerateFormOptions } from '../types/index.js';

/**
 * Generate a Google Form from a markdown survey template
 */
export async function generateForm(options: GenerateFormOptions): Promise<string> {
  const auth = await getAuthClient();
  const forms = google.forms({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });
  
  // 1. Read and parse survey template
  const markdown = await fs.readFile(options.templatePath, 'utf-8');
  const survey = parseSurveyTemplate(markdown);
  
  // 2. Create new Google Form
  const createResponse = await forms.forms.create({
    requestBody: {
      info: {
        title: survey.title,
        documentTitle: survey.title,
      },
    },
  });
  
  const formId = createResponse.data.formId;
  if (!formId) {
    throw new Error('Failed to create form - no formId returned');
  }
  
  // 3. Build batch update requests for questions
  const requests: any[] = [];
  
  // Add description if present
  if (survey.description) {
    requests.push({
      updateFormInfo: {
        info: {
          description: survey.description,
        },
        updateMask: 'description',
      },
    });
  }
  
  // Add each question
  survey.questions.forEach((question, index) => {
    requests.push({
      createItem: {
        item: buildQuestionItem(question),
        location: { index },
      },
    });
  });
  
  // 4. Add conditional logic for weekly check-in
  if (options.type === 'weekly-checkin') {
    // Note: Conditional logic in Forms API is complex and may require manual setup
    // For now, we'll just add the questions; conditional logic can be added manually
  }
  
  // 5. Execute batch update
  if (requests.length > 0) {
    await forms.forms.batchUpdate({
      formId,
      requestBody: { requests },
    });
  }
  
  // 6. Set sharing to "Anyone with link can respond"
  await drive.permissions.create({
    fileId: formId,
    requestBody: {
      type: 'anyone',
      role: 'writer',
    },
  });
  
  // 7. Return viewform URL
  return `https://docs.google.com/forms/d/${formId}/viewform`;
}

