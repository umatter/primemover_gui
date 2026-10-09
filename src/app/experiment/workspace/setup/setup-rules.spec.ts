import { Crawler } from '@app/crawler/model/crawler';
import { inSchema, missingRequired, schemaFor, unsetFields } from './job-settings';
import { readiness, setupSteps } from './setup-steps';

/** F4 (docs/specs/gui-finalisation.md): the rules behind the guidance. */
describe('job settings', () => {
  const b = (name: string, active: boolean | number = true) => ({ name, active });

  it('finds the schema regardless of case, and nothing for an unknown type', () => {
    expect(schemaFor('VisitJob')?.apiType).toBe('visitjob');
    expect(schemaFor('teleportjob')).toBeUndefined();
    expect(schemaFor(undefined)).toBeUndefined();
  });

  it('lists required settings with no ACTIVE behaviour', () => {
    expect(missingRequired('visitjob', [])).toEqual(['url']);
    expect(missingRequired('visitjob', [b('url')])).toEqual([]);
    expect(missingRequired('visitjob', [b('url', 0)])).toEqual(['url']);
    expect(missingRequired('entertextfieldjob', [b('text')])).toEqual(['selector']);
  });

  it('never flags a job type it does not know', () => {
    expect(missingRequired('teleportjob', [])).toEqual([]);
  });

  it('offers the unset fields, required first', () => {
    expect(unsetFields('entertextfieldjob', [b('text')]).map((f) => f.name)).toEqual([
      'selector',
      'selectionType',
      'appendReturn',
      'typingMode',
      'captchaMode'
    ]);
  });

  it('knows which names are in the schema, and says nothing for an unknown type', () => {
    expect(inSchema('visitjob', 'url')).toBeTrue();
    expect(inSchema('visitjob', 'colour')).toBeFalse();
    expect(inSchema('teleportjob', 'url')).toBeNull();
  });
});

describe('setup steps', () => {
  const param = {
    id: 1,
    configuration_id: 5,
    pi: '0',
    psi: '0',
    kappa: '0',
    tau: '0',
    alpha: '1',
    beta: '0',
    search_terms: '[]',
    media_outlet_urls: '[]'
  };
  const bot = (over: Partial<Crawler>): Crawler => ({ id: 1, name: 'b', experiment_id: 1, ...over }) as Crawler;
  const complete = bot({
    agent_id: 1,
    proxy_id: 2,
    configuration_id: 5,
    configuration: { id: 5, name: 'p', params: [param] }
  } as Partial<Crawler>);

  it('is ready when identity, connection, profile and treatment are all set', () => {
    expect(setupSteps(complete).map((s) => [s.key, s.done])).toEqual([
      ['identity', true],
      ['connection', true],
      ['profile', true],
      ['treatment', true]
    ]);
    expect(readiness(complete)).toEqual({ ready: true, left: 0 });
  });

  it('counts what is missing', () => {
    const half = bot({ agent_id: 1 } as Partial<Crawler>);
    expect(readiness(half)).toEqual({ ready: false, left: 3 });
  });

  it('treats a profile without params as a missing treatment', () => {
    const noTreatment = bot({ ...complete, configuration: { id: 5, name: 'p', params: [] } });
    expect(setupSteps(noTreatment).find((s) => s.key === 'treatment')!.done).toBeFalse();
  });

  it('cannot say when the payload does not embed the profile, and readiness says nothing', () => {
    const unembedded = bot({
      agent_id: 1,
      proxy_id: 2,
      configuration_id: 5,
      configuration: undefined
    } as Partial<Crawler>);
    expect(setupSteps(unembedded).find((s) => s.key === 'treatment')!.done).toBeNull();
    expect(readiness(unembedded)).toBeNull();
  });
});
