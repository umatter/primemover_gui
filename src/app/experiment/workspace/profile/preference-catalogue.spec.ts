import {
  cookieMode,
  cookieValue,
  DEFAULT_PREFERENCES,
  isDecisionWeight,
  missingDefaults,
  preferenceKind,
  preferenceError,
  USAGE_TYPE_SUGGESTIONS
} from './preference-catalogue';

/** F1 (docs/specs/gui-finalisation.md): the known-preference catalogue. */
describe('preference catalogue', () => {
  it('types the known names and leaves the rest as text', () => {
    expect(preferenceKind('location')).toBe('location');
    expect(preferenceKind('cookie_pref')).toBe('cookie');
    expect(preferenceKind('usage_type')).toBe('usageType');
    expect(preferenceKind('aversion_mainstream_media_channels')).toBe('weight');
    expect(preferenceKind('preference_fringe_videos')).toBe('weight');
    expect(preferenceKind('order')).toBe('weight');
    expect(preferenceKind('ideology')).toBe('text');
  });

  it('groups the YouTube decision weights', () => {
    expect(isDecisionWeight('preference_political_videos')).toBeTrue();
    expect(isDecisionWeight('order')).toBeTrue();
    expect(isDecisionWeight('location')).toBeFalse();
  });

  describe('cookie_pref', () => {
    it('reads the runner form back into a mode', () => {
      expect(cookieMode('{"accept_all": true}')).toBe('accept');
      expect(cookieMode('{"accept_all":false}')).toBe('reject');
      expect(cookieMode('{"accept_all": true, "extra": 1}')).toBe('custom');
      expect(cookieMode('reject')).toBe('custom');
    });

    it('writes the exact form the experiment designer emits', () => {
      expect(cookieValue('accept')).toBe('{"accept_all": true}');
      expect(cookieValue('reject')).toBe('{"accept_all": false}');
    });

    it('rejects custom JSON the runner would ignore', () => {
      expect(preferenceError('cookie', '{"accept_all": true}')).toBeNull();
      expect(preferenceError('cookie', 'not json')).toBe('workspace.profile.error.cookieJson');
      expect(preferenceError('cookie', '{"other": true}')).toBe('workspace.profile.error.cookieKey');
      expect(preferenceError('cookie', '[true]')).toBe('workspace.profile.error.cookieKey');
    });
  });

  it('requires a number for a decision weight, text anywhere else', () => {
    expect(preferenceError('weight', '0.25')).toBeNull();
    expect(preferenceError('weight', '-1')).toBeNull();
    expect(preferenceError('weight', 'high')).toBe('workspace.profile.error.number');
    expect(preferenceError('location', 'anything')).toBeNull();
  });

  // The API turns "" and whitespace into null, and the column is NOT NULL (review on #59).
  it('requires a non-empty value for every kind', () => {
    for (const kind of ['text', 'location', 'usageType', 'weight', 'cookie'] as const) {
      expect(preferenceError(kind, '')).withContext(kind).toBe('workspace.profile.error.required');
      expect(preferenceError(kind, '   ')).withContext(kind).toBe('workspace.profile.error.required');
    }
  });

  it('suggests the canonical usage_type vocabulary', () => {
    expect(USAGE_TYPE_SUGGESTIONS).toEqual(['only_search', 'only_direct', 'both']);
  });

  it('offers the designer defaults that are missing, and only those', () => {
    expect(DEFAULT_PREFERENCES.map((p) => p.name)).toEqual(['location', 'cookie_pref', 'usage_type']);
    expect(missingDefaults(['location', 'ideology']).map((p) => p.name)).toEqual(['cookie_pref', 'usage_type']);
    expect(missingDefaults(['location', 'cookie_pref', 'usage_type'])).toEqual([]);
  });
});
