import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { SharedEffects } from './store/shared.effects';
import { sharedFeature } from '@shared/store/shared.reducer';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    StoreModule.forFeature(sharedFeature),
    EffectsModule.forFeature([SharedEffects])
  ],
  exports: []
})
export class SharedModule {}
