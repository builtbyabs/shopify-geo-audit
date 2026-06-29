import type { CheckResult, StoreFetch } from '../types.js';

const MIN_WORDS_PASS = 100;
const MIN_WORDS_WARN = 50;

function descriptionWordCount(bodyText: string): number {
  // Heuristic: count words in the main body, already stripped of nav/footer
  return bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
}

function hasAnswerFirstLead(bodyText: string): boolean {
  // Answer-first: first 200 chars contain a concrete noun + adjective or number
  const lead = bodyText.slice(0, 200).toLowerCase();
  return /\b(shop|buy|get|find|discover|explore|all|best|our|new|free|fast|made|built|designed)\b/.test(lead);
}

export function checkContentDepth(store: StoreFetch): CheckResult {
  const { productPages } = store;

  if (productPages.length === 0) {
    return {
      id: 'content-depth',
      label: 'Product description depth (answer-first content)',
      status: 'warn',
      impact: 'med',
      detail: 'No product pages found to measure description depth.',
    };
  }

  const wordCounts = productPages.map((p) => descriptionWordCount(p.bodyText));
  const avg = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length);
  const answerFirst = productPages.filter((p) => hasAnswerFirstLead(p.bodyText)).length;

  if (avg >= MIN_WORDS_PASS && answerFirst >= Math.ceil(productPages.length / 2)) {
    return {
      id: 'content-depth',
      label: 'Product description depth (answer-first content)',
      status: 'pass',
      impact: 'med',
      detail: `Avg ${avg} words per product page. Most pages lead with a clear answer — good AI-citation signal.`,
    };
  }

  if (avg >= MIN_WORDS_WARN) {
    return {
      id: 'content-depth',
      label: 'Product description depth (answer-first content)',
      status: 'warn',
      impact: 'med',
      detail: `Avg ${avg} words per product page — borderline thin. AI citation needs ≥${MIN_WORDS_PASS} words of clear, answer-first content.`,
    };
  }

  return {
    id: 'content-depth',
    label: 'Product description depth (answer-first content)',
    status: 'fail',
    impact: 'med',
    detail: `Avg ${avg} words per product page — too thin. AI assistants need substantive descriptions to cite your products.`,
  };
}
