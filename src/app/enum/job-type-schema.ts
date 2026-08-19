/**
 * Per-job-type parameter schema — a job's parameters are expressed as Behaviours
 * ({name, value}). Ported from the orchestrator `experiment_designer` job registry
 * (the authoritative source, also behind MCP `get_job_type_schema`). Keep in sync with
 * `primemover-orchestrator/experiment_designer/spec/job_registry.py`.
 *
 * `options` turns a field into a select; absence means a free-text input.
 */
export interface JobFieldSchema {
  name: string;
  required: boolean;
  default?: string;
  description?: string;
  options?: string[];
}

export interface JobTypeSchema {
  apiType: string;
  displayName: string;
  description: string;
  fields: JobFieldSchema[];
}

const SELECTION_TYPES = ['XPATH', 'CSS', 'ID', 'NAME', 'CLASS_NAME', 'TAG_NAME', 'LINK_TEXT'];
const CAPTCHA = ['never', 'always'];
const SCROLL_DIR = ['DOWN', 'UP'];
const BOOL = ['false', 'true'];
const TYPING = ['SIMULATED_FIXINGTYPOS', 'SIMULATED', 'INSTANT'];

const captchaMode: JobFieldSchema = {
  name: 'captchaMode',
  required: false,
  default: 'never',
  description: 'Captcha handling',
  options: CAPTCHA
};
const selectionType: JobFieldSchema = {
  name: 'selectionType',
  required: false,
  default: 'XPATH',
  description: 'Selector type',
  options: SELECTION_TYPES
};

export const JOB_TYPE_SCHEMAS: Record<string, JobTypeSchema> = {
  visitjob: {
    apiType: 'visitjob',
    displayName: 'Visit URL',
    description: 'Navigate to a specified URL',
    fields: [{ name: 'url', required: true, description: 'Target URL' }, captchaMode]
  },
  waitjob: {
    apiType: 'waitjob',
    displayName: 'Wait',
    description: 'Pause execution for a number of seconds',
    fields: [{ name: 'seconds', required: true, description: 'Wait duration in seconds' }, captchaMode]
  },
  clickjob: {
    apiType: 'clickjob',
    displayName: 'Click',
    description: 'Click an element on the page',
    fields: [{ name: 'selector', required: true, description: 'Element selector' }, selectionType, captchaMode]
  },
  tryclickjob: {
    apiType: 'tryclickjob',
    displayName: 'Try Click',
    description: 'Attempt to click an element (continues on failure)',
    fields: [
      { name: 'selector', required: true },
      selectionType,
      { name: 'task', required: false },
      { name: 'flag', required: false },
      captchaMode
    ]
  },
  entertextfieldjob: {
    apiType: 'entertextfieldjob',
    displayName: 'Type Text',
    description: 'Enter text into a field',
    fields: [
      { name: 'text', required: true, description: 'Text to enter' },
      { name: 'selector', required: true, description: 'Field selector' },
      selectionType,
      { name: 'appendReturn', required: false, default: 'false', description: 'Press Enter after typing', options: BOOL },
      { name: 'typingMode', required: false, default: 'SIMULATED_FIXINGTYPOS', description: 'Typing simulation', options: TYPING },
      captchaMode
    ]
  },
  tryentertextfieldjob: {
    apiType: 'tryentertextfieldjob',
    displayName: 'Try Type Text',
    description: 'Attempt to enter text (continues on failure)',
    fields: [
      { name: 'text', required: true },
      { name: 'selector', required: true },
      selectionType,
      { name: 'appendReturn', required: false, default: 'false', options: BOOL },
      { name: 'typingMode', required: false, default: 'SIMULATED_FIXINGTYPOS', options: TYPING },
      captchaMode
    ]
  },
  scrollbydurationjob: {
    apiType: 'scrollbydurationjob',
    displayName: 'Scroll (duration)',
    description: 'Scroll the page for a duration',
    fields: [
      { name: 'duration', required: true, description: 'Scroll duration in seconds' },
      { name: 'scrollDirection', required: false, default: 'DOWN', options: SCROLL_DIR },
      captchaMode
    ]
  },
  scrollbylengthjob: {
    apiType: 'scrollbylengthjob',
    displayName: 'Scroll (length)',
    description: 'Scroll the page by a pixel amount',
    fields: [
      { name: 'length', required: true, description: 'Pixels to scroll' },
      { name: 'scrollDirection', required: false, default: 'DOWN', options: SCROLL_DIR },
      captchaMode
    ]
  },
  singleselectjob: {
    apiType: 'singleselectjob',
    displayName: 'Single Select',
    description: 'Select a single element',
    fields: [{ name: 'selector', required: true }, selectionType, captchaMode]
  },
  singleselecturljob: {
    apiType: 'singleselecturljob',
    displayName: 'Single Select URL',
    description: 'Select a single URL element',
    fields: [{ name: 'selector', required: true }, selectionType, captchaMode]
  },
  switchjob: {
    apiType: 'switchjob',
    displayName: 'Switch',
    description: 'Switch browser context (tab/frame)',
    fields: [{ name: 'target', required: true }, captchaMode]
  },
  tryswitchjob: {
    apiType: 'tryswitchjob',
    displayName: 'Try Switch',
    description: 'Attempt to switch context (continues on failure)',
    fields: [{ name: 'target', required: true }, captchaMode]
  },
  handlealertjob: {
    apiType: 'handlealertjob',
    displayName: 'Handle Alert',
    description: 'Handle a browser alert dialog',
    fields: [{ name: 'action', required: true, description: 'accept or dismiss', options: ['accept', 'dismiss'] }, captchaMode]
  },
  tryhandlealertjob: {
    apiType: 'tryhandlealertjob',
    displayName: 'Try Handle Alert',
    description: 'Attempt to handle an alert (continues on failure)',
    fields: [{ name: 'action', required: true, options: ['accept', 'dismiss'] }, captchaMode]
  },
  lambdasingleselectjob: {
    apiType: 'lambdasingleselectjob',
    displayName: 'Lambda Select',
    description: 'Use AWS Lambda for element selection',
    fields: [
      { name: 'task', required: true, description: 'Task identifier' },
      { name: 'linkValue', required: true, description: 'Function name or ARN' },
      { name: 'linkType', required: false, default: 'FUNCTION_NAME', options: ['FUNCTION_NAME', 'FUNCTION_ARN'] },
      captchaMode
    ]
  }
};

/** Ordered list for the type <select>. */
export const JOB_TYPE_OPTIONS: JobTypeSchema[] = Object.values(JOB_TYPE_SCHEMAS);
