/** One search term the bot may search for, at a political position in [-1, 1]. */
export interface SearchTerm {
  term: string;
  pi: number;
}

/** One media outlet the bot knows, at a political position in [-1, 1]. */
export interface MediaOutlet {
  domain: string;
  url: string | null;
  pi: number;
}

/**
 * A configuration's params row — the bot's treatment.
 *
 * As the API sends it: weights are strings for stored rows ("0.5") and numbers for a
 * freshly created one; the two lists are JSON-encoded STRINGS (the runner parses them
 * with getText()), or null on rows that predate umatter/primemover_api#85. Read it
 * through `treatment-model.ts`, never field by field.
 */
export interface Param {
  id: number;
  configuration_id: number;
  pi: number | string | null;
  psi: number | string | null;
  kappa: number | string | null;
  tau: number | string | null;
  alpha: number | string | null;
  beta: number | string | null;
  search_terms: string | SearchTerm[] | null;
  media_outlet_urls: string | MediaOutlet[] | null;
}
