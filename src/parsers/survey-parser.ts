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
  
  // Parse questions and sections - split by ### headers
  // Match both numbered questions (### 1.) and sections (### SECTION:)
  const sections = markdown.split(/###\s+(?:\d+\.\s+|SECTION:\s*)/).slice(1);
  
  for (const section of sections) {
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
  const lines = section.trim().split('\n').map(l => l.trim());
  if (lines.length === 0) return null;

  const title = lines[0] ?? '';
  if (!title) return null;

  let type: SurveyQuestion['type'] = 'long-answer'; // Default
  let required = false;
  let description: string | undefined = undefined;
  const options: string[] = [];
  const rows: string[] = [];
  const columns: string[] = [];

  let parsing: 'options' | 'rows' | 'columns' | null = null;

  for (const line of lines.slice(1)) {
    if (line.startsWith('**Type:**')) {
      const typeStr = line.substring('**Type:**'.length).trim();
      type = parseQuestionType(typeStr);
      required = typeStr.includes('(required)');
      parsing = null;
    } else if (line.startsWith('**Options:**')) {
      parsing = 'options';
    } else if (line.startsWith('**Rows:**')) {
      parsing = 'rows';
    } else if (line.startsWith('**Columns:**')) {
      parsing = 'columns';
    } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      description = line.substring(1, line.length - 1).trim();
      parsing = null;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const value = line.substring(2).trim();
      if (parsing === 'options') options.push(value);
      if (parsing === 'rows') rows.push(value);
      if (parsing === 'columns') columns.push(value);
    } else if (line.trim() === '') {
      parsing = null;
    }
  }

  const question: SurveyQuestion = {
    title,
    type,
    required,
    description,
  };

  if (options.length > 0) question.options = options;
  if (rows.length > 0) question.rows = rows;
  if (columns.length > 0) question.columns = columns;

  // Filter out empty options that might sneak in
  if(question.options) question.options = question.options.filter(Boolean);
  if(question.rows) question.rows = question.rows.filter(Boolean);
  if(question.columns) question.columns = question.columns.filter(Boolean);

  return question;
}

/**
 * Parse question type from string
 */
function parseQuestionType(typeStr: string): SurveyQuestion['type'] {
  const lower = typeStr.toLowerCase();
  if (lower.includes('page-break') || lower.includes('page break')) {
    return 'page-break';
  }
  if (lower.includes('choice-grid') || lower.includes('choice grid') || lower.includes('multiple choice grid')) {
    return 'choice-grid';
  }
  if (lower.includes('multiple choice') || lower.includes('multiple-choice')) {
    return 'multiple-choice';
  }
  if (lower.includes('linear scale') || lower.includes('linear-scale')) {
    return 'linear-scale';
  }
  if (lower.includes('short answer') || lower.includes('short-answer')) {
    return 'short-answer';
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
  // Handle page breaks (section headers) - use text items for section headers
  if (question.type === 'page-break') {
    return {
      title: question.title,
      description: question.description,
      pageBreakItem: {},
    };
  }

  if (question.type === 'choice-grid') {
    return {
      title: question.title,
      description: question.description,
      questionGroupItem: {
        grid: {
          columns: {
            type: 'RADIO',
            options: (question.columns || []).map(col => ({ value: col })),
          },
        },
        questions: (question.rows || []).map(row => ({
          rowQuestion: { title: row },
        })),
      },
    };
  }

  const baseItem: any = {
    title: question.title,
    description: question.description,
    questionItem: {
      question: {
        required: question.required,
      },
    },
  };

  const q = baseItem.questionItem.question;

  switch (question.type) {
    case 'multiple-choice':
      q.choiceQuestion = {
        type: 'RADIO',
        options: (question.options || []).map(opt => ({ value: opt })),
      };
      break;

    case 'checkboxes':
      q.choiceQuestion = {
        type: 'CHECKBOX',
        options: (question.options || []).map(opt => ({ value: opt })),
      };
      break;

    case 'dropdown':
      q.choiceQuestion = {
        type: 'DROP_DOWN',
        options: (question.options || []).map(opt => ({ value: opt })),
      };
      break;

    case 'linear-scale':
      q.scaleQuestion = {
        low: question.low || 1,
        high: question.high || 5,
        lowLabel: question.lowLabel,
        highLabel: question.highLabel,
      };
      break;

    case 'short-answer':
      q.textQuestion = {
        paragraph: false,
      };
      break;

    case 'long-answer':
      q.textQuestion = {
        paragraph: true,
      };
      break;

    default:
      q.textQuestion = {
        paragraph: false,
      };
  }

  return baseItem;
}

