import { MediaOutlet, Param, SearchTerm } from '@app/config/model/param';

/**
 * The treatment's rules, shared by the bot page and the workspace cards.
 *
 * Mirrors the runner, not a guess about it:
 *  - it reads the FIRST params row the API lists (`PrimemoverApiConverter`, `params.get(0)`);
 *  - control arm ⇔ pi = psi = kappa = tau = 0 (`LambdaSelectJobHandler`, the rule
 *    `treatment_lost` is computed against) — alpha and beta do not make a treatment;
 *  - an outlet is "known" when its domain equals the result's host minus a leading
 *    `www.` (`SelectingHelper.normalizeDomainFromHref`), compared exactly.
 */

export type Arm = 'control' | 'treatment' | 'none' | 'unknown';

/** The four weights that decide the arm. */
const ARM_WEIGHTS = ['pi', 'psi', 'kappa', 'tau'] as const;

/** An editable params row: numbers and real arrays. */
export interface TreatmentDraft {
  pi: number;
  psi: number;
  kappa: number;
  tau: number;
  alpha: number;
  beta: number;
  search_terms: SearchTerm[];
  media_outlet_urls: MediaOutlet[];
}

export interface CsvResult<T> {
  rows: T[];
  /** 1-based line numbers that could not be read. Nothing from them is imported. */
  badLines: number[];
}

/** A weight as a number. Missing is 0 — what the runner's `double` field holds for null. */
export function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

export function isControlArm(weights: Partial<Record<(typeof ARM_WEIGHTS)[number], number | string | null>>): boolean {
  return ARM_WEIGHTS.every((w) => num(weights[w]) === 0);
}

/**
 * The bot's arm from its configuration's params.
 *
 * `undefined` is "the API did not send params" (an older API, or a payload without the
 * relation) and is unknown — never silently "control".
 */
export function armOf(params: Param[] | undefined | null): Arm {
  if (params === undefined || params === null) return 'unknown';
  if (!params.length) return 'none';
  return isControlArm(params[0]) ? 'control' : 'treatment';
}

/** A list field as the API sends it — JSON string, array, or legacy null — as an array. */
export function parseList<T>(value: string | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toDraft(param: Param): TreatmentDraft {
  return {
    pi: num(param.pi),
    psi: num(param.psi),
    kappa: num(param.kappa),
    tau: num(param.tau),
    alpha: num(param.alpha),
    beta: num(param.beta),
    search_terms: parseList<SearchTerm>(param.search_terms).map((t) => ({ term: String(t.term ?? ''), pi: num(t.pi) })),
    media_outlet_urls: parseList<MediaOutlet>(param.media_outlet_urls).map((o) => ({
      domain: String(o.domain ?? ''),
      url: o.url ?? null,
      pi: num(o.pi)
    }))
  };
}

/** The domain the runner will compare against: host only, lower-case, no `www.`. */
export function normalizeDomain(input: string): string {
  let value = (input ?? '').trim().toLowerCase();
  if (!value) return '';
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  value = value.split(/[/?#]/)[0];
  value = value.replace(/:\d+$/, '');
  return value.startsWith('www.') ? value.slice(4) : value;
}

function isPosition(value: number): boolean {
  return Number.isFinite(value) && value >= -1 && value <= 1;
}

/**
 * Why the draft cannot be saved, keyed by field (`pi`, `search_terms.0`, ...). Empty when
 * it can. The same rules the API enforces (umatter/primemover_api#85), so a 422 is the
 * exception rather than the way the user finds out.
 */
export function weightErrors(draft: TreatmentDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!isPosition(draft.pi)) errors['pi'] = 'workspace.treatment.error.position';
  for (const w of ['psi', 'tau', 'alpha', 'beta'] as const) {
    if (!Number.isFinite(draft[w])) errors[w] = 'workspace.treatment.error.number';
  }
  if (!Number.isInteger(draft.kappa) || draft.kappa < 0) errors['kappa'] = 'workspace.treatment.error.kappa';

  draft.search_terms.forEach((t, i) => {
    if (!t.term.trim()) errors[`search_terms.${i}`] = 'workspace.treatment.error.term';
    else if (!isPosition(t.pi)) errors[`search_terms.${i}`] = 'workspace.treatment.error.position';
  });
  draft.media_outlet_urls.forEach((o, i) => {
    if (!o.domain.trim()) errors[`media_outlet_urls.${i}`] = 'workspace.treatment.error.domain';
    else if (!isPosition(o.pi)) errors[`media_outlet_urls.${i}`] = 'workspace.treatment.error.position';
  });
  return errors;
}

/** `term,pi` lines; an optional header; quoted fields may contain commas. */
export function parseTermsCsv(text: string): CsvResult<SearchTerm> {
  return parseCsv(text, ['term', 'pi'], (cells) => {
    const [term, pi] = cells;
    const position = Number(pi);
    if (!term?.trim() || pi === undefined || pi.trim() === '' || !isPosition(position)) return null;
    return { term: term.trim(), pi: position };
  });
}

/** `domain,url,pi` lines; url may be empty; the domain is normalised. */
export function parseOutletsCsv(text: string): CsvResult<MediaOutlet> {
  return parseCsv(text, ['domain', 'url', 'pi'], (cells) => {
    const [domain, url, pi] = cells;
    const position = Number(pi);
    const normalised = normalizeDomain(domain ?? '');
    if (!normalised || pi === undefined || pi.trim() === '' || !isPosition(position)) return null;
    return { domain: normalised, url: url?.trim() ? url.trim() : null, pi: position };
  });
}

function parseCsv<T>(text: string, header: string[], read: (cells: string[]) => T | null): CsvResult<T> {
  const rows: T[] = [];
  const badLines: number[] = [];
  (text ?? '').split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const cells = splitCsvLine(line);
    const isHeader = index === 0 && cells.map((c) => c.trim().toLowerCase()).join(',') === header.join(',');
    if (isHeader) return;
    const row = read(cells);
    if (row === null) badLines.push(index + 1);
    else rows.push(row);
  });
  return { rows, badLines };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}
