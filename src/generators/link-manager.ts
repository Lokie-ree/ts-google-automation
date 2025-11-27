import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GeneratedLinks } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.join(__dirname, '../../output/generated-links.json');

/**
 * Manages generated Google Docs/Forms URLs
 */
export class LinkManager {
  /**
   * Save generated links to JSON file
   */
  async save(links: GeneratedLinks): Promise<void> {
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(links, null, 2));
  }
  
  /**
   * Load existing links from JSON file
   */
  async load(): Promise<GeneratedLinks> {
    const content = await fs.readFile(OUTPUT_PATH, 'utf-8');
    return JSON.parse(content);
  }
  
  /**
   * Check if links file exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(OUTPUT_PATH);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Format links for Convex email templates
   */
  formatForConvex(links: GeneratedLinks): string {
    return `// Copy these into your convex/email.ts:

const FRAMEWORK_URL = "${links.frameworkUrl}";
const WELCOME_KIT_URL = "${links.welcomeKitUrl}";
const POST_FRAMEWORK_SURVEY_URL = "${links.postFrameworkSurveyUrl}";
const WEEKLY_CHECKIN_URL = "${links.weeklyCheckinUrl}";

// Generated at: ${links.generatedAt}`;
  }
}

