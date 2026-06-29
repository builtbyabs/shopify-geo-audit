import type { CheckResult, StoreFetch } from '../types.js';

export function checkLlmsTxt(store: StoreFetch): CheckResult {
  if (store.llmsTxtReachable) {
    return {
      id: 'llms-txt',
      label: 'llms.txt present',
      status: 'pass',
      impact: 'med',
      detail: '/llms.txt found — LLM crawlers have an explicit content manifest.',
    };
  }

  return {
    id: 'llms-txt',
    label: 'llms.txt present',
    status: 'fail',
    impact: 'med',
    detail: '/llms.txt not found — no content manifest for AI crawlers. Most stores miss this; it\'s an instant win.',
  };
}
