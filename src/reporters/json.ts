import type { AuditResults } from '../types.js';

export function formatJson(results: AuditResults): string {
  return JSON.stringify(results, null, 2);
}
