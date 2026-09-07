import { TestBed } from '@angular/core/testing';

import { ClipboardService } from '@shared/service/clipboard.service';

/**
 * The copy control on a `status_message` reports what actually happened: a "Copied" tick
 * that is a lie is worse than an honest failure, because the next thing a researcher does
 * with an 1800-character diagnostic is paste it into an issue and discover it is empty.
 *
 * Both paths are exercised here because on this stack both are reachable. The async
 * Clipboard API is unavailable in an insecure context — which is exactly how the lab box
 * is reached over plain HTTP — and can be refused by permissions policy, so the
 * `execCommand` fallback is not decoration.
 */
describe('ClipboardService', () => {
  let service: ClipboardService;
  /** The real descriptor, restored after each test — `navigator.clipboard` is read-only. */
  let originalClipboard: PropertyDescriptor | undefined;

  const stubClipboard = (value: unknown): void => {
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClipboardService);
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  });

  afterEach(() => {
    if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else delete (navigator as unknown as Record<string, unknown>)['clipboard'];
  });

  it('uses the async Clipboard API and reports success', async () => {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    stubClipboard({ writeText });

    await expectAsync(service.copy('minor error encountered - lambda filter failed')).toBeResolvedTo(true);
    expect(writeText).toHaveBeenCalledWith('minor error encountered - lambda filter failed');
  });

  it('falls back to execCommand when the Clipboard API is refused', async () => {
    // Insecure context, no user gesture, permissions policy: all reject rather than throw
    // synchronously, and the legacy path frequently still works where this one does not.
    stubClipboard({ writeText: () => Promise.reject(new Error('NotAllowedError')) });
    const exec = spyOn(document, 'execCommand').and.returnValue(true);

    await expectAsync(service.copy('browser died')).toBeResolvedTo(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('falls back to execCommand when there is no Clipboard API at all', async () => {
    stubClipboard(undefined);
    const exec = spyOn(document, 'execCommand').and.returnValue(true);

    await expectAsync(service.copy('browser died')).toBeResolvedTo(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('reports false — never a silent success — when both paths fail', async () => {
    stubClipboard(undefined);
    spyOn(document, 'execCommand').and.returnValue(false);

    await expectAsync(service.copy('browser died')).toBeResolvedTo(false);
  });

  it('reports false when the legacy path throws', async () => {
    stubClipboard(undefined);
    spyOn(document, 'execCommand').and.throwError('execCommand is not a function');

    await expectAsync(service.copy('browser died')).toBeResolvedTo(false);
  });

  it('leaves no textarea behind after the fallback runs', async () => {
    stubClipboard(undefined);
    spyOn(document, 'execCommand').and.returnValue(true);
    // A delta, not an absolute count: Jasmine randomises order and the karma page has a
    // DOM of its own, so asserting "zero textareas in the document" tests the other specs.
    const before = document.body.querySelectorAll('textarea').length;

    await service.copy('browser died');

    expect(document.body.querySelectorAll('textarea').length).toBe(before);
  });

  it('leaves no textarea behind even when the copy is refused', async () => {
    stubClipboard(undefined);
    spyOn(document, 'execCommand').and.returnValue(false);
    const before = document.body.querySelectorAll('textarea').length;

    await service.copy('browser died');

    expect(document.body.querySelectorAll('textarea').length).toBe(before);
  });

  it('refuses an empty payload rather than clearing the clipboard', async () => {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    stubClipboard({ writeText });
    const exec = spyOn(document, 'execCommand').and.returnValue(true);

    await expectAsync(service.copy('')).toBeResolvedTo(false);
    await expectAsync(service.copy(null as unknown as string)).toBeResolvedTo(false);
    expect(writeText).not.toHaveBeenCalled();
    expect(exec).not.toHaveBeenCalled();
  });
});
