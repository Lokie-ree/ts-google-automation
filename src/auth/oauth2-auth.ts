import { google, Auth } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { authenticate } from '@google-cloud/local-auth';

const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/drive.file',
];

const TOKEN_PATH = path.join(process.cwd(), 'config/token.json');
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(os.homedir(), '.config', 'google-cloud', 'pelican-beta-automation-338a134ead0c.json');

/**
 * Authenticate with Google using OAuth2 (better for Workspace APIs)
 */
export async function authenticateGoogle(): Promise<Auth.OAuth2Client> {
  try {
    // Try to load existing token
    try {
      const content = await fs.readFile(TOKEN_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      const auth = google.auth.fromJSON(credentials);
      if (auth && 'credentials' in auth) {
        return auth as unknown as Auth.OAuth2Client;
      }
    } catch (err) {
      // Token doesn't exist or is invalid, continue to create new one
    }
    
    // Ensure config directory exists
    await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
    
    // Run OAuth2 flow
    const auth = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    
    // Save token for future use
    const credentials = {
      type: 'authorized_user',
      client_id: (auth as any)._clientId,
      client_secret: (auth as any)._clientSecret,
      refresh_token: (auth as any).credentials.refresh_token,
    };
    
    await fs.writeFile(TOKEN_PATH, JSON.stringify(credentials, null, 2));
    
    return auth as unknown as Auth.OAuth2Client;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        throw new Error(
          'Google credentials file not found. Please:\n' +
          '1. Go to https://console.cloud.google.com/\n' +
          '2. Create OAuth 2.0 credentials (not service account)\n' +
          '3. Download and save as ~/.config/google-cloud/pelican-beta-automation-338a134ead0c.json\n' +
          '4. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable to the file path'
        );
      }
    }
    throw error;
  }
}

/**
 * Get an authenticated client from existing token
 */
export async function getAuthClient(): Promise<Auth.OAuth2Client> {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    const auth = google.auth.fromJSON(credentials);
    if (auth && 'credentials' in auth) {
      return auth as unknown as Auth.OAuth2Client;
    }
    throw new Error('Invalid credentials format');
  } catch (error) {
    throw new Error(
      'Authentication required. Please run: npm run auth\n' +
      'Original error: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}
