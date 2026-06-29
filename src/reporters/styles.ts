// Hazard Terminal design system — inline CSS for the self-contained report.
// Kept here (data module) so html.ts stays focused on structure + logic.

export const REPORT_CSS = `
/* ─── Design tokens — Hazard Terminal ─── */
:root {
  --ink:      #0A0A0A;
  --paper:    #F2EFE6;
  --accent:   #E8FF00;
  --fail:     #FF3B1D;
  --warn:     #FFB800;
  --pass:     #00D26A;
  --dim:      #6B6860;
  --border:   #1E1E1E;
  --card-bg:  #111111;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; }

body {
  background: var(--ink);
  color: var(--paper);
  font-family: 'IBM Plex Mono', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  min-height: 100vh;
}

/* ─── Layout ─── */
.wrap { max-width: 860px; margin: 0 auto; padding: 0 24px; }

/* ─── Header ─── */
header {
  border-bottom: 3px solid var(--accent);
  padding: 40px 0 32px;
}

.header-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.brand {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
}

.store-name {
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  line-height: 1.1;
  color: var(--paper);
  margin-top: 8px;
  word-break: break-word;
}

.store-url {
  color: var(--dim);
  font-size: 0.75rem;
  margin-top: 4px;
}

.timestamp {
  font-size: 0.7rem;
  color: var(--dim);
  text-align: right;
  white-space: nowrap;
}

/* ─── Score block ─── */
.score-block {
  padding: 48px 0 40px;
  border-bottom: 1px solid var(--border);
}

.score-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dim);
  margin-bottom: 12px;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.score-number {
  font-family: 'Archivo Black', sans-serif;
  font-size: clamp(4rem, 12vw, 7rem);
  line-height: 1;
}

.score-number.strong    { color: var(--pass); }
.score-number.needs-work { color: var(--warn); }
.score-number.at-risk   { color: var(--fail); }

.score-denom {
  font-size: 1.5rem;
  color: var(--dim);
}

.score-band {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 4px 12px;
  border: 2px solid currentColor;
}

.score-band.strong    { color: var(--pass); }
.score-band.needs-work { color: var(--warn); }
.score-band.at-risk   { color: var(--fail); }

/* ─── Stats row ─── */
.stats {
  display: flex;
  gap: 32px;
  margin-top: 32px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-num {
  font-family: 'Archivo Black', sans-serif;
  font-size: 1.75rem;
  line-height: 1;
}

.stat-num.fail-color { color: var(--fail); }
.stat-num.warn-color { color: var(--warn); }
.stat-num.pass-color { color: var(--pass); }

.stat-lbl {
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--dim);
}

/* ─── Section ─── */
section {
  padding: 48px 0;
  border-bottom: 1px solid var(--border);
}

.section-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--dim);
  margin-bottom: 24px;
}

/* ─── Check rows ─── */
.checks { display: flex; flex-direction: column; gap: 2px; }

.check-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-left: 3px solid transparent;
}

.check-row.fail { border-color: var(--fail); background: rgba(255,59,29,0.05); }
.check-row.warn { border-color: var(--warn); background: rgba(255,184,0,0.05); }
.check-row.pass { border-color: var(--pass); background: rgba(0,210,106,0.04); }

.check-icon {
  font-size: 1rem;
  width: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.check-row.fail .check-icon { color: var(--fail); }
.check-row.warn .check-icon { color: var(--warn); }
.check-row.pass .check-icon { color: var(--pass); }

.check-body { flex: 1; min-width: 0; }

.check-label {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: var(--paper);
  margin-bottom: 4px;
}

.check-detail {
  font-size: 0.78rem;
  color: var(--dim);
  line-height: 1.5;
}

/* ─── Badges ─── */
.badge {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 2px 7px;
  border: 1px solid currentColor;
}

.badge-high { color: var(--fail); }
.badge-med  { color: var(--warn); }
.badge-low  { color: var(--dim);  }

/* ─── Footer ─── */
footer {
  padding: 40px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-brand {
  font-family: 'Archivo Black', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
}

.footer-link {
  font-size: 0.7rem;
  color: var(--dim);
  text-decoration: none;
}
.footer-link:hover { color: var(--paper); }

/* ─── Accent line ─── */
.accent-bar {
  height: 3px;
  background: var(--accent);
  width: 40px;
  margin: 16px 0;
}`;
