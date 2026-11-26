import { Param } from '@app/config/model/param';
import {
  armOf,
  isControlArm,
  normalizeDomain,
  parseList,
  parseOutletsCsv,
  parseTermsCsv,
  toDraft,
  weightErrors
} from './treatment-model';

/** F2 (docs/specs/gui-finalisation.md): the treatment's pure rules. */
describe('treatment model', () => {
  const param = (over: Partial<Param> = {}): Param => ({
    id: 1,
    configuration_id: 5,
    pi: '0',
    psi: '0',
    kappa: '0',
    tau: '0',
    alpha: '1',
    beta: '0',
    search_terms: '[]',
    media_outlet_urls: '[]',
    ...over
  });

  describe('the arm', () => {
    it('is control exactly when pi = psi = kappa = tau = 0, as the runner decides', () => {
      expect(isControlArm({ pi: 0, psi: 0, kappa: 0, tau: 0 })).toBeTrue();
      // alpha and beta do not make a treatment
      expect(armOf([param({ alpha: '0.7', beta: '0.2' })])).toBe('control');
      expect(armOf([param({ pi: '-0.5' })])).toBe('treatment');
      expect(armOf([param({ kappa: 2 })])).toBe('treatment');
      expect(armOf([param({ tau: '1' })])).toBe('treatment');
    });

    it('reads stored strings and fresh numbers alike', () => {
      expect(armOf([param({ pi: 0, psi: 0, kappa: 0, tau: 0 })])).toBe('control');
      expect(armOf([param({ pi: '0.0' })])).toBe('control');
    });

    it('treats a missing weight as 0, the way the runner reads a null double', () => {
      expect(armOf([param({ psi: null, tau: null })])).toBe('control');
    });

    it('is none without a params row, and unknown when the API did not say', () => {
      expect(armOf([])).toBe('none');
      expect(armOf(undefined)).toBe('unknown');
    });

    it('follows the FIRST row, the one the runner uses', () => {
      expect(armOf([param(), param({ id: 2, pi: '0.9' })])).toBe('control');
    });
  });

  describe('lists', () => {
    it('parses the wire string, an array, or a legacy null', () => {
      expect(parseList<{ term: string }>('[{"term":"a","pi":0.1}]')).toEqual([{ term: 'a', pi: 0.1 } as any]);
      expect(parseList([{ term: 'b', pi: 0 }])).toEqual([{ term: 'b', pi: 0 }]);
      expect(parseList(null)).toEqual([]);
      expect(parseList('not json')).toEqual([]);
    });

    it('builds an editable draft with numeric weights', () => {
      const draft = toDraft(
        param({ pi: '-0.5', kappa: '2', search_terms: '[{"term":"climate","pi":-0.2}]', media_outlet_urls: null })
      );
      expect(draft.pi).toBe(-0.5);
      expect(draft.kappa).toBe(2);
      expect(draft.search_terms).toEqual([{ term: 'climate', pi: -0.2 }]);
      expect(draft.media_outlet_urls).toEqual([]);
    });
  });

  describe('outlet domains', () => {
    it('normalises to what the runner matches: host, lower-case, no www.', () => {
      expect(normalizeDomain('https://www.CNBC.com/business/')).toBe('cnbc.com');
      expect(normalizeDomain('www.theatlantic.com')).toBe('theatlantic.com');
      expect(normalizeDomain('  nytimes.com  ')).toBe('nytimes.com');
      expect(normalizeDomain('edition.cnn.com/world')).toBe('edition.cnn.com');
      expect(normalizeDomain('')).toBe('');
    });
  });

  describe('CSV paste', () => {
    it('reads term,pi with or without a header and reports bad lines by number', () => {
      const result = parseTermsCsv('term,pi\nclimate,-0.2\n"gun control, debate",0.4\nbroken\nfar,7\n');
      expect(result.rows).toEqual([
        { term: 'climate', pi: -0.2 },
        { term: 'gun control, debate', pi: 0.4 }
      ]);
      expect(result.badLines).toEqual([4, 5]);
    });

    it('reads domain,url,pi and normalises the domain', () => {
      const result = parseOutletsCsv('https://www.cnbc.com,https://www.cnbc.com/,-0.02\nfoxnews.com,,0.6\nx.com,,abc');
      expect(result.rows).toEqual([
        { domain: 'cnbc.com', url: 'https://www.cnbc.com/', pi: -0.02 },
        { domain: 'foxnews.com', url: null, pi: 0.6 }
      ]);
      expect(result.badLines).toEqual([3]);
    });
  });

  describe('weight validation', () => {
    it('mirrors the API rules', () => {
      const ok = toDraft(param());
      expect(weightErrors(ok)).toEqual({});
      expect(weightErrors({ ...ok, pi: 1.5 })).toEqual({ pi: 'workspace.treatment.error.position' });
      expect(weightErrors({ ...ok, kappa: 1.5 })).toEqual({ kappa: 'workspace.treatment.error.kappa' });
      expect(weightErrors({ ...ok, kappa: -1 })).toEqual({ kappa: 'workspace.treatment.error.kappa' });
      expect(weightErrors({ ...ok, tau: NaN })).toEqual({ tau: 'workspace.treatment.error.number' });
    });

    it('checks every list row too', () => {
      const ok = toDraft(param());
      const bad = {
        ...ok,
        search_terms: [{ term: '', pi: 0 }],
        media_outlet_urls: [{ domain: 'x.com', url: null, pi: 3 }]
      };
      expect(weightErrors(bad)).toEqual({
        'search_terms.0': 'workspace.treatment.error.term',
        'media_outlet_urls.0': 'workspace.treatment.error.position'
      });
    });
  });
});
