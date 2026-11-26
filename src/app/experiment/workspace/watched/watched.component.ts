import { Component, Input, OnDestroy } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { WatchedApiService } from './watched-api.service';

export type WatchedState = 'idle' | 'loading' | 'loaded' | 'empty' | 'unavailable' | 'error';

/**
 * F3 — the bot's watch history (docs/specs/gui-finalisation.md): what its decisions
 * selected, the list the `already_watched` filter reads.
 *
 * Collapsed, and loaded on first open only: it is history, not status, and most visits
 * to the bot page are not about it. "Nothing watched" is said only when the API answered
 * an empty list; a server without the column (409) or the route (404) is "not available",
 * which is a different claim.
 */
@Component({
  selector: 'app-bot-watched',
  templateUrl: './watched.component.html',
  standalone: true,
  imports: [NgIf, NgForOf, TranslateModule]
})
export class WatchedComponent implements OnDestroy {
  @Input({ required: true }) botId!: number;

  state: WatchedState = 'idle';
  ids: string[] = [];

  private subscription?: Subscription;

  constructor(private api: WatchedApiService) {}

  onToggle(open: boolean): void {
    if (!open || this.state !== 'idle') return;
    this.state = 'loading';
    this.subscription = this.api.watched(this.botId).subscribe({
      next: (ids) => {
        this.ids = ids;
        this.state = ids.length ? 'loaded' : 'empty';
      },
      error: (err: HttpErrorResponse) => {
        this.state = err?.status === 409 || err?.status === 404 ? 'unavailable' : 'error';
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
