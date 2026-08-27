import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { fadeSlideInOut } from '../../animation/trigger';
import { NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  standalone: true,
  imports: [NgIf],
  animations: [fadeSlideInOut]
})
export class NotificationComponent implements OnChanges {
  @Input() typeError: boolean = false;
  @Input() typeSuccess: boolean = false;
  @Input() typeInfo: boolean = false;
  @Input() titleText: string = 'Notification';
  @Input() bodyText: string = '';
  @Input() error!: HttpErrorResponse | any;
  @Output() closeRequested = new EventEmitter<boolean>();

  /**
   * Whether the toast is on screen.
   *
   * A plain field, written only from `ngOnChanges()` and `close()`. It used to
   * be a getter that returned `this.close()`, which meant (a) every instance
   * that does not bind `[error]` could never render -- six of the nine
   * `<app-notification>` instances in the app, including the job download
   * toast and both upload failure toasts -- and (b) an `@Output` was emitted
   * from inside change detection, an ExpressionChangedAfterItHasBeenChecked /
   * repeated-emit hazard.
   */
  show: boolean = false;

  /**
   * True once `[error]` has been bound at least once. Angular reports every
   * bound input in the first `ngOnChanges()`, including a statically bound one
   * and one whose value is null, so this reliably distinguishes "this call site
   * gates on an error object" from "this call site does not bind error at all".
   */
  private errorBound: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ('error' in changes) {
      this.errorBound = true;
    }

    // Re-evaluated on every input change, which also un-dismisses the toast
    // when a *new* notification arrives after the user closed the last one.
    this.show = this.shouldShow();
  }

  close(): void {
    this.show = false;
    this.closeRequested.emit(true);
  }

  /**
   * A notification needs a kind (error/success/info) to render at all.
   *
   * Beyond that, `[error]` acts as the gate for the call sites that bind it and
   * set their kind statically (login, user settings, the global wrapper): they
   * must stay hidden until there really is an error. Call sites that do not
   * bind it are gated by their own `*ngIf` or by a dynamic kind flag, so the
   * kind alone is the right signal there.
   */
  private shouldShow(): boolean {
    if (!this.typeError && !this.typeSuccess && !this.typeInfo) {
      return false;
    }

    return this.errorBound ? !!this.error : true;
  }
}
