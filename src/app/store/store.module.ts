import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { metaReducer, reducer } from './state';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { environment } from '@environments/environment';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

@NgModule({
  declarations: [],
  imports: [
    StoreModule.forRoot(reducer, { metaReducers: metaReducer }),
    EffectsModule.forRoot([]),
    StoreRouterConnectingModule.forRoot(),
    !environment.production ? StoreDevtoolsModule.instrument() : []
  ]
})
export class AppStoreModule {}
