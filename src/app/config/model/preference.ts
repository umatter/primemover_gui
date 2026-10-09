/**
 * One preference of a configuration: a named, string-valued setting of the bot's
 * profile (location, cookie consent, usage type, the YouTube decision weights ...).
 *
 * The API stores every value as a string and never deletes a preference; switching
 * one off is `active = false`.
 */
export interface Preference {
  id?: number;
  name: string;
  value: string;
  description?: string | null;
  /** 0/1 from the API; a boolean when the GUI sends it. */
  active: number | boolean;
}

/** What `PUT configurations/{id}` takes for each preference. */
export interface PreferenceChange {
  name: string;
  value: string;
  description?: string | null;
  active: boolean;
}
