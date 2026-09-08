import { Injectable } from '@angular/core';

/**
 * Copy text to the clipboard, with the legacy path still in place.
 *
 * A thin service rather than a call to `navigator.clipboard` at the call site, for two
 * reasons. The async Clipboard API is unavailable in an insecure context and can be
 * refused by permission policy, so a component that called it directly would silently do
 * nothing on exactly the machines where a researcher is reading an 1800-character
 * diagnostic off a lab box on plain HTTP; and a component that owns a `document`
 * side-effect is a component that cannot be tested without one.
 *
 * Both paths report honestly: `false` means the text is **not** on the clipboard, so the
 * caller can say so instead of showing a "Copied" tick that is a lie.
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  async copy(text: string): Promise<boolean> {
    const payload = (text ?? '').toString();
    if (!payload) return false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        return true;
      }
    } catch {
      // Refused (insecure context, permissions policy, no user gesture). Fall through
      // rather than give up: the legacy path often still works where this one does not.
    }

    return this.copyViaTextarea(payload);
  }

  /**
   * `document.execCommand('copy')` — deprecated, and the only fallback there is.
   *
   * The textarea is off-screen rather than `display:none`: a hidden element cannot hold a
   * selection, so hiding it the obvious way makes the copy silently fail.
   *
   * **The removal is in a `finally`, and that is the point.** `execCommand` is absent or
   * throws in exactly the contexts this fallback exists for (an insecure origin, a browser
   * that has finished deprecating it), and the removal used to sit inside the `try` after
   * it — so the throwing path, the only one that leaks, was the one with no cleanup. Each
   * refused copy then left a readonly, focusable, tab-reachable textarea in `document.body`
   * for the life of the page. `area.remove()` rather than `removeChild` because the throw
   * can also come from `appendChild`, and removing a node that was never attached must not
   * throw a second error out of the cleanup.
   */
  private copyViaTextarea(text: string): boolean {
    const area = document.createElement('textarea');
    try {
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }
}
