import { JobFieldSchema, JobTypeSchema, JOB_TYPE_SCHEMAS } from '@app/enum/job-type-schema';

/** The part of a behaviour these rules read. `active` is 0/1 from the API. */
export interface BehaviourLike {
  name: string;
  active: boolean | number;
}

/**
 * A job type's schema, or undefined for a type this GUI does not know.
 *
 * Unknown is not "has no settings": the runner may know types the ported registry does
 * not, so every rule below says nothing about them rather than guessing.
 */
export function schemaFor(type: string | null | undefined): JobTypeSchema | undefined {
  if (!type) return undefined;
  return JOB_TYPE_SCHEMAS[type.trim().toLowerCase()];
}

/** Names of required settings with no ACTIVE behaviour — what the runner will miss. */
export function missingRequired(type: string | null | undefined, behaviours: BehaviourLike[]): string[] {
  const schema = schemaFor(type);
  if (!schema) return [];
  const set = activeNames(behaviours);
  return schema.fields.filter((f) => f.required && !set.has(f.name)).map((f) => f.name);
}

/** The schema's fields with no behaviour yet (active or not), required first. */
export function unsetFields(type: string | null | undefined, behaviours: BehaviourLike[]): JobFieldSchema[] {
  const schema = schemaFor(type);
  if (!schema) return [];
  const named = new Set(behaviours.map((b) => b.name));
  const unset = schema.fields.filter((f) => !named.has(f.name));
  return [...unset.filter((f) => f.required), ...unset.filter((f) => !f.required)];
}

/** Whether `name` is a setting of this job type; null when the type is unknown. */
export function inSchema(type: string | null | undefined, name: string): boolean | null {
  const schema = schemaFor(type);
  if (!schema) return null;
  return schema.fields.some((f) => f.name === name);
}

function activeNames(behaviours: BehaviourLike[]): Set<string> {
  return new Set(behaviours.filter((b) => Boolean(Number(b.active))).map((b) => b.name));
}
