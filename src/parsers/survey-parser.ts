import type { ParsedSurvey, SurveyQuestion } from '../types/index.js';

/**
 * Parse survey template from markdown format
 */
export function parseSurveyTemplate(markdown: string): ParsedSurvey {
  const survey: ParsedSurvey = {
    title: '',
    description: '',
    questions: [],
  };
  
  // Parse title
  const titleMatch = markdown.match(/\*\*Form Title:\*\*\s*(.+)/);
  if (titleMatch?.[1]) {
    survey.title = titleMatch[1].trim();
  }
  
  // Parse description
  const descMatch = markdown.match(/\*\*Description:\*\*\s*(.+)/);
  if (descMatch?.[1]) {
    survey.description = descMatch[1].trim();
  }
  
  // Parse questions - split by ### headers
  const questionSections = markdown.split(/###\s+\d+\.\s+/).slice(1);
  
  for (const section of questionSections) {
    const question = parseQuestionSection(section);
    if (question) {
      survey.questions.push(question);
    }
  }
  
  return survey;
}

/**
 * Parse a single question section
 */
function parseQuestionSection(section: string): SurveyQuestion | null {
  const lines = section.trim().split('\n');
  if (lines.length === 0) return null;
  
  // First line is the question title
  const title = lines[0]?.trim() ?? '';
  if (!title) return null;
  
  // Find the type line
  const typeMatch = section.match(/\*\*Type:\*\*\s*(.+)/);
  if (!typeMatch?.[1]) return null;
  
  const typeStr = typeMatch[1].trim();
  const type = parseQuestionType(typeStr);
  
  // Check if required
  const required = section.includes('(required)') || !section.includes('(optional)');
  
  const question: SurveyQuestion = {
    title,
    type,
    required,
  };
  
  // Parse type-specific details
  if (type === 'multiple-choice' || type === 'checkboxes' || type === 'dropdown') {
    // Extract options
    const optionsMatch = section.match(/\*\*Options:\*\*\s*\n((?:[-*]\s+.+\n?)+)/);
    if (optionsMatch?.[1]) {
      question.options = optionsMatch[1]
        .split('\n')
        .filter(line => line.trim().match(/^[-*]\s+/))
        .map(line => line.replace(/^[-*]\s+/, '').trim())
        .filter(Boolean);
    }
  } else if (type === 'linear-scale') {
    // Extract scale labels
    const labelLines = section.match(/[-*]\s+(\d+)\s*=\s*(.+)/g);
    if (labelLines && labelLines.length >= 2) {
      const firstLabel = labelLines[0]?.match(/[-*]\s+(\d+)\s*=\s*(.+)/);
      const lastLabel = labelLines[labelLines.length - 1]?.match(/[-*]\s+(\d+)\s*=\s*(.+)/);
      
      if (firstLabel?.[1] && firstLabel[2]) {
        question.low = parseInt(firstLabel[1]);
        question.lowLabel = firstLabel[2].trim();
      }
      if (lastLabel?.[1] && lastLabel[2]) {
        question.high = parseInt(lastLabel[1]);
        question.highLabel = lastLabel[2].trim();
      }
    }
  }
  
  return question;
}

/**
 * Parse question type from string
 */
function parseQuestionType(typeStr: string): SurveyQuestion['type'] {
  const lower = typeStr.toLowerCase();
  if (lower.includes('multiple choice') || lower.includes('multiple-choice')) {
    return 'multiple-choice';
  }
  if (lower.includes('linear scale') || lower.includes('linear-scale')) {
    return 'linear-scale';
  }
  if (lower.includes('long answer') || lower.includes('long-answer')) {
    return 'long-answer';
  }
  if (lower.includes('checkboxes') || lower.includes('checkbox')) {
    return 'checkboxes';
  }
  if (lower.includes('dropdown') || lower.includes('drop-down')) {
    return 'dropdown';
  }
  return 'long-answer'; // default
}

/**
 * Build a Google Forms API question item from a parsed question
 */
export function buildQuestionItem(question: SurveyQuestion): any {
  const baseItem: any = {
    title: question.title,
    questionItem: {
      question: {
        required: question.required,
      },
    },
  };
  
  switch (question.type) {
    case 'multiple-choice':
      baseItem.questionItem.question.choiceQuestion = {
        type: 'RADIO',
        options: (question.options || []).map(opt => ({ value: opt })),
      };
      break;
      
    case 'checkboxes':
      baseItem.questionItem.question.choiceQuestion = {
        type: 'CHECKBOX',
        options: (question.options || []).map(opt => ({ value: opt })),
      };
      break;
      
    case 'dropdown':
      baseItem.questionItem.question.choiceQuestion = {
        type: 'DROP_DOWN',
        options: (question.options || []).map(opt => ({ value: opt })),
      };
      break;
      
    case 'linear-scale':
      baseItem.questionItem.question.scaleQuestion = {
        low: question.low || 1,
        high: question.high || 5,
        lowLabel: question.lowLabel,
        highLabel: question.highLabel,
      };
      break;
      
    case 'long-answer':
      baseItem.questionItem.question.textQuestion = {
        paragraph: true,
      };
      break;
      
    default:
      baseItem.questionItem.question.textQuestion = {
        paragraph: false,
      };
  }
  
  return baseItem;
}

