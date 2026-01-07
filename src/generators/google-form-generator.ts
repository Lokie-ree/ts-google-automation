import { google } from 'googleapis';
import fs from 'fs/promises';
import { getAuthClient } from '../auth/google-auth.js';
import { parseSurveyTemplate, buildQuestionItem } from '../parsers/survey-parser.js';
import type { GenerateFormOptions } from '../types/index.js';

/**
 * Generate a Google Form from a markdown survey template
 */
export async function generateForm(options: GenerateFormOptions): Promise<string> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:10',message:'generateForm entry',data:{formType:options.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:12',message:'Before getAuthClient',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const auth = await getAuthClient();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:15',message:'After getAuthClient',data:{authExists:!!auth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:21',message:'Creating API clients',data:{authCredentials:auth.credentials ? {hasAccessToken:!!auth.credentials.access_token,hasRefreshToken:!!auth.credentials.refresh_token,expiryDate:auth.credentials.expiry_date} : 'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Try to get access token first to catch refresh errors early
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:25',message:'Attempting to get access token',data:{hasRefreshToken:!!auth.credentials?.refresh_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Force token refresh to catch errors early
    await auth.getAccessToken();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:30',message:'Access token obtained successfully',data:{hasAccessToken:!!auth.credentials?.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  } catch (tokenError: any) {
    // #region agent log
    const tokenErrorDetails = {
      errorMessage: tokenError?.message || 'Unknown error',
      errorCode: tokenError?.code,
      errorName: tokenError?.name,
      responseStatus: tokenError?.response?.status,
      responseData: tokenError?.response?.data ? JSON.stringify(tokenError.response.data).substring(0, 1000) : undefined,
      hasInvalidGrant: (tokenError?.message?.includes('invalid_grant')) ||
                       (tokenError?.response?.data?.error && typeof tokenError.response.data.error === 'string' && tokenError.response.data.error.includes('invalid_grant')) ||
                       (tokenError?.response?.data?.error_description && typeof tokenError.response.data.error_description === 'string' && tokenError.response.data.error_description.includes('invalid_grant')) ||
                       false,
    };
    console.error('Token Refresh Error:', tokenErrorDetails);
    fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:38',message:'Token refresh failed',data:tokenErrorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch((fetchErr) => {
      console.error('Failed to log token error:', fetchErr);
    });
    // #endregion
    throw tokenError;
  }
  
  const forms = google.forms({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });
  
  // 1. Read and parse survey template
  const markdown = await fs.readFile(options.templatePath, 'utf-8');
  const survey = parseSurveyTemplate(markdown);
  
  // 2. Create new Google Form
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:20',message:'Before forms.create API call',data:{title:survey.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  let createResponse;
  try {
    createResponse = await forms.forms.create({
      requestBody: {
        info: {
          title: survey.title,
          documentTitle: survey.title,
        },
      },
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:30',message:'After forms.create API call success',data:{hasFormId:!!createResponse.data.formId,formId:createResponse.data.formId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  } catch (apiError: any) {
    // #region agent log
    const errorDetails = {
      errorMessage: apiError?.message || 'Unknown error',
      errorCode: apiError?.code,
      errorName: apiError?.name,
      errorStack: apiError?.stack?.substring(0, 1000),
      responseStatus: apiError?.response?.status,
      responseStatusText: apiError?.response?.statusText,
      responseData: apiError?.response?.data ? JSON.stringify(apiError.response.data).substring(0, 1000) : undefined,
      responseError: apiError?.response?.data?.error,
      responseErrorDescription: apiError?.response?.data?.error_description,
      hasInvalidGrant: (apiError?.message?.includes('invalid_grant')) ||
                      (apiError?.response?.data?.error && typeof apiError.response.data.error === 'string' && apiError.response.data.error.includes('invalid_grant')) ||
                      (apiError?.response?.data?.error_description && typeof apiError.response.data.error_description === 'string' && apiError.response.data.error_description.includes('invalid_grant')) ||
                      false,
    };
    // Use console.error as backup since fetch might fail
    console.error('API Error Details:', errorDetails);
    fetch('http://127.0.0.1:7242/ingest/28a023ef-bf78-4eec-9133-bb82fae05314',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'google-form-generator.ts:48',message:'forms.create API call error',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch((fetchErr) => {
      console.error('Failed to log error:', fetchErr);
    });
    // #endregion
    throw apiError;
  }
  
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

