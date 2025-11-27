import type { docs_v1 } from 'googleapis';

// Content source paths from docs folder
export const PELICAN_CONTENT_PATHS = {
  // Framework documents
  framework001: 'docs/frameworks/AIB-001-lesson-objective-unpacker.md',
  
  // Survey templates
  postFrameworkSurvey: 'docs/forms/post-framework-survey.md',
  weeklyCheckin: 'docs/forms/weekly-check-in-survey.md',
  
  // Welcome kit
  welcomeKit: 'docs/context/beta-welcome-kit.md',
  
  // Brand guidelines
  brandGuidelines: 'docs/context/PELICAN_AI_BRAND_GUIDELINES.md',
} as const;

// Pelican AI project context
export const PELICAN_CONTEXT = {
  projectName: 'Pelican AI',
  tagline: 'Navigate AI with Confidence',
  mission: 'Empower Louisiana educators with practical, ethical, and platform-agnostic AI guidance',
  
  phase1Goals: {
    betaTesters: 20,
    emailOpenRate: 0.75,
    timeSavingsTarget: 0.80,
    satisfactionRating: 0.90,
    pageLoadTime: 3,
    emailDeliveryTime: 10,
  },
  
  emailAddresses: {
    hello: 'hello@pelicanai.org',
    beta: 'beta@pelicanai.org',
    weekly: 'weekly@pelicanai.org',
  },
  
  urls: {
    website: 'https://pelicanai.org',
    primaryLogo: 'https://pelicanai.org/primary-logo.png',
    secondaryLogo: 'https://pelicanai.org/secondary-logo.png',
  },
  
  betaProgram: {
    startDate: '2025-10-15',
    duration: '12 weeks',
    cohortSize: 20,
    targetAudience: 'Louisiana K-12 educators',
  },
} as const;

// Markdown parsing interfaces
export interface ParsedTemplate {
  title: string;
  content: string;
  metadata: {
    category?: string;
    tags?: string[];
    timeEstimate?: string;
    difficulty?: string;
    [key: string]: unknown;
  };
}

// Survey/Form interfaces
export interface SurveyQuestion {
  title: string;
  type: 'multiple-choice' | 'linear-scale' | 'long-answer' | 'checkboxes' | 'dropdown';
  required: boolean;
  options?: string[];
  low?: number;
  high?: number;
  lowLabel?: string;
  highLabel?: string;
}

export interface ParsedSurvey {
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

// Generated content tracking
export interface GeneratedLinks {
  frameworkUrl: string;
  welcomeKitUrl: string;
  postFrameworkSurveyUrl: string;
  weeklyCheckinUrl: string;
  generatedAt: string;
}

// Document generation options
export interface GenerateDocOptions {
  templatePath: string;
  surveyUrl?: string;
  frameworkUrl?: string;
  postFrameworkSurveyUrl?: string;
  weeklyCheckinUrl?: string;
}

export interface GenerateFormOptions {
  templatePath: string;
  type: 'post-framework-survey' | 'weekly-checkin';
}

// Google Docs API helpers
export type DocsRequest = docs_v1.Schema$Request;
export type DocsColor = docs_v1.Schema$OptionalColor;

