import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';

@Injectable()
export class QueueEffects {
  constructor(private actions$: Actions) {}
}
