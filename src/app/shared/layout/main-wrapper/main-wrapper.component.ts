import { Component } from '@angular/core';
import { fadeIn } from '../../animation/trigger';
import { Store } from '@ngrx/store';
import { selectIsSignedIn } from '@app/store/auth/auth.selectors';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';
import { selectError } from '@shared/store/shared.reducer';
import { SharedActions } from '@shared/store/shared.actions';
import { map } from 'rxjs';

/** Longest body text the toast shows before truncating. */
const MAX_DETAIL_LENGTH = 300;

/**
 * Collapse an arbitrary server string into one short, printable line.
 * Returns '' for anything unusable (an HTML error page, a Blob, an empty body).
 */
function cleanText(value: any): string {
  if (typeof value !== 'string') {
    return '';
  }

  const text = value.replace(/\s+/g, ' ').trim();

  if (!text || text.startsWith('<')) {
    // An HTML error page (Laravel's debug page, a proxy's 502) is not a message.
    return '';
  }

  return text.length > MAX_DETAIL_LENGTH ? `${text.slice(0, MAX_DETAIL_LENGTH - 1)}…` : text;
}

/** First usable string among the candidates. */
function firstText(...candidates: any[]): string {
  for (const candidate of candidates) {
    const text = cleanText(candidate);
    if (text) {
      return text;
    }
  }

  return '';
}

/** Render Laravel's 422 body -- {"errors": {"field": ["msg", ...]}} -- as one line. */
function describeValidationErrors(errors: any): string {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return '';
  }

  return Object.keys(errors)
    .map((field) => {
      const messages = errors[field];
      const text = firstText(Array.isArray(messages) ? messages.join(' ') : messages);

      return text ? `${field}: ${text}` : '';
    })
    .filter((line) => !!line)
    .join(' ');
}

/**
 * Turn an HttpErrorResponse (or anything error-shaped) into something a human can act on.
 *
 * The template used to bind `statusText`, i.e. the bare HTTP reason phrase
 * ("Unprocessable Content", "Internal Server Error"), so Laravel's `{"message": ...}`
 * and its 422 `{"errors": {...}}` never reached the user.
 * Exported for reuse; it belongs in a shared util once one exists.
 */
export function describeHttpError(error: any): string {
  if (!error) {
    return '';
  }

  const status: number | null = typeof error.status === 'number' ? error.status : null;

  if (status === 0) {
    return 'Could not reach the server. Check your connection and that the API is running.';
  }

  // On an HttpErrorResponse `error` holds the parsed response body; a plain
  // thrown object is its own body.
  const body = error.error ?? error;
  const message = firstText(body?.message, body?.error, body, error.statusText, error.message);
  const validation = describeValidationErrors(body?.errors);
  const detail = [message, validation].filter((part) => !!part).join(' — ');
  const prefix = status ? `HTTP ${status}` : '';

  if (!detail) {
    return prefix || 'Unknown error';
  }

  return prefix ? `${prefix}: ${detail}` : detail;
}

@Component({
  selector: 'app-main-wrapper',
  templateUrl: './main-wrapper.component.html',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, NgIf, NotificationComponent],
  animations: [fadeIn]
})
export class MainWrapperComponent {
  isLoggedIn$ = this.store.select(selectIsSignedIn);
  error$ = this.store.select(selectError);
  /** The current error plus the text the user actually gets to read. */
  notification$ = this.error$.pipe(map((error) => (error ? { error, bodyText: describeHttpError(error) } : null)));

  constructor(private store: Store) {}

  dismiss() {
    this.store.dispatch(SharedActions.errorResetRequested());
  }
}
