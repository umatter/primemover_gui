import { linkifyPreviousJob, previousJobId, splitStatusMessage, STATUS_MESSAGE_SEPARATOR } from './status-message';

/**
 * The parsing half of "make the diagnosis readable".
 *
 * Every fixture in this file is a real `status_message` shape off the ex63 database (the
 * first is quoted in `docs/proposals/gui-error-warning-surfacing.md`), not an invented
 * one, because the split is only worth anything if it survives what the runner actually
 * writes.
 */
describe('status_message parsing', () => {
  const LAMBDA =
    'minor error encountered - lambda filter children_entertainment failed: APIConnectionError: ' +
    'Connection error.; lambda: UserWarning (line 1007): Videos targeted at children not filtered out...';
  const LOST_JOBS = 'completed with lost jobs - 23/29 jobs succeeded (0 warning, 2 failed, 4 skipped)';
  const SKIPPED = 'previous task was not executed - previous job 34129 did not succeed';

  describe('splitStatusMessage', () => {
    it('splits at the first " - " and keeps the state text as the head', () => {
      const parts = splitStatusMessage(LAMBDA);

      expect(parts.head).toBe('minor error encountered');
      expect(parts.rest.startsWith('lambda filter children_entertainment failed')).toBeTrue();
      expect(parts.hasMore).toBeTrue();
      expect(parts.full).toBe(LAMBDA);
    });

    it('splits at the FIRST separator only — later ones belong to the detail', () => {
      const parts = splitStatusMessage('state - first detail - second detail');

      expect(parts.head).toBe('state');
      expect(parts.rest).toBe('first detail - second detail');
    });

    it('handles the two other real message shapes', () => {
      expect(splitStatusMessage(LOST_JOBS).head).toBe('completed with lost jobs');
      expect(splitStatusMessage(LOST_JOBS).rest).toBe('23/29 jobs succeeded (0 warning, 2 failed, 4 skipped)');
      expect(splitStatusMessage(SKIPPED).head).toBe('previous task was not executed');
      expect(splitStatusMessage(SKIPPED).rest).toBe('previous job 34129 did not succeed');
    });

    it('leaves a message with no separator whole, with nothing to expand', () => {
      const parts = splitStatusMessage('done');

      expect(parts.head).toBe('done');
      expect(parts.rest).toBe('');
      expect(parts.hasMore).toBeFalse();
    });

    /**
     * A hyphen without surrounding spaces occurs inside details all the time
     * (`content-type`, `2026-09-07`, `non-lambda`). Splitting on it would cut a message
     * mid-word and invent a clause the runner never wrote.
     */
    it('does not split on a bare hyphen', () => {
      const parts = splitStatusMessage('failed to load non-lambda job 2026-09-07');

      expect(parts.head).toBe('failed to load non-lambda job 2026-09-07');
      expect(parts.hasMore).toBeFalse();
    });

    it('never hides the only clause there is', () => {
      // A leading separator would otherwise produce an empty head and put everything
      // behind a control the reader has to find first.
      const parts = splitStatusMessage(`${STATUS_MESSAGE_SEPARATOR}orphaned detail`);

      expect(parts.head).toBe('- orphaned detail');
      expect(parts.hasMore).toBeFalse();
    });

    it('treats a trailing separator as nothing more to show', () => {
      const parts = splitStatusMessage('state - ');

      expect(parts.head).toBe('state');
      expect(parts.rest).toBe('');
      expect(parts.hasMore).toBeFalse();
    });

    it('never yields the literal "null" for an absent message', () => {
      for (const empty of [null, undefined, '', '   ']) {
        const parts = splitStatusMessage(empty);
        expect(parts.head).toBe('');
        expect(parts.full).toBe('');
        expect(parts.hasMore).toBeFalse();
      }
    });
  });

  describe('previousJobId', () => {
    it('reads the job a skipped job blames', () => {
      expect(previousJobId(SKIPPED)).toBe(34129);
    });

    it('tolerates a "#" and loose whitespace, and ignores case', () => {
      expect(previousJobId('Previous Job #99 did not succeed')).toBe(99);
      expect(previousJobId('previous  job   12')).toBe(12);
    });

    it('is null when there is no reference', () => {
      expect(previousJobId(LOST_JOBS)).toBeNull();
      expect(previousJobId('previous job did not succeed')).toBeNull();
      expect(previousJobId(null)).toBeNull();
    });
  });

  describe('linkifyPreviousJob', () => {
    it('splits the text around the reference, keeping the phrase as the link', () => {
      const segments = linkifyPreviousJob('previous job 34129 did not succeed');

      expect(segments.map((s) => s.text)).toEqual(['previous job 34129', ' did not succeed']);
      expect(segments[0].jobId).toBe(34129);
      expect(segments[1].jobId).toBeNull();
    });

    it('keeps the text either side of a mid-sentence reference', () => {
      const segments = linkifyPreviousJob('skipped because previous job 7 failed');

      expect(segments.map((s) => s.text)).toEqual(['skipped because ', 'previous job 7', ' failed']);
      expect(segments.map((s) => s.text).join('')).toBe('skipped because previous job 7 failed');
    });

    it('links every reference in a message, not only the first', () => {
      // A module-level global regex would keep `lastIndex` between calls and drop matches;
      // this asserts the per-call RegExp that avoids it.
      const segments = linkifyPreviousJob('previous job 1 and previous job 2');

      expect(segments.filter((s) => s.jobId !== null).map((s) => s.jobId)).toEqual([1, 2]);
      expect(linkifyPreviousJob('previous job 3').filter((s) => s.jobId !== null).length).toBe(1);
    });

    it('returns plain text as a single segment', () => {
      expect(linkifyPreviousJob('done')).toEqual([{ text: 'done', jobId: null }]);
    });

    it('returns nothing for an empty message', () => {
      expect(linkifyPreviousJob('')).toEqual([]);
      expect(linkifyPreviousJob(null)).toEqual([]);
    });

    it('reassembles to exactly the input, so nothing is lost or duplicated', () => {
      for (const message of [LAMBDA, LOST_JOBS, SKIPPED, 'previous job 5']) {
        expect(
          linkifyPreviousJob(message)
            .map((s) => s.text)
            .join('')
        ).toBe(message);
      }
    });
  });
});
