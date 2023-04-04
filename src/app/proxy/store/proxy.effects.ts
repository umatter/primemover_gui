import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';

@Injectable()
export class ProxyEffects {
  constructor(private actions$: Actions) {}
}
