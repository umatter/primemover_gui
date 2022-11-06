import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxPaginationModule } from 'ngx-pagination';
import { ButtonComponent } from './form/button/button.component';
import { MobileMenuComponent } from './layout/mobile-menu/mobile-menu.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { MainComponent } from './layout/main/main.component';
import { MainWrapperComponent } from './layout/main-wrapper/main-wrapper.component';
import { ContainerComponent } from './layout/container/container.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { HeaderComponent } from './layout/header/header.component';
import { NotificationComponent } from './overlay/notification/notification.component';
import { SingleActionCenteredComponent } from './overlay/alert/single-action-centered/single-action-centered.component';
import { BackdropComponent } from './overlay/backdrop/backdrop.component';
import { WideButtonsCenteredComponent } from './overlay/alert/wide-buttons-centered/wide-buttons-centered.component';
import { WithButtonsComponent } from './overlay/alert/with-buttons/with-buttons.component';
import { WithDismissComponent } from './overlay/alert/with-dismiss/with-dismiss.component';
import { WithFooterComponent } from './overlay/alert/with-footer/with-footer.component';
import { AlertLeftAlignedButtonsComponent } from './overlay/alert/left-aligned-buttons/alert-left-aligned-buttons.component';
import { ControlsComponent } from './pagination/controls/controls.component';
import { SelectBrandedComponent } from './form/select-branded/select-branded.component';
import { SelectNativeComponent } from './form/select-native/select-native.component';
import { LinkSortableComponent } from './link/link-sortable/link-sortable.component';
import { RemovableBadgeComponent } from './badge/removable-badge/removable-badge.component';
import { LoadingSpinnerComponent } from './overlay/loading-spinner/loading-spinner.component';
import { StoreModule } from '@ngrx/store';
import { queueReducer } from '../queue/store/queue.reducer';
import { EffectsModule } from '@ngrx/effects';
import { SharedEffects } from './store/shared.effects';
import { sharedReducer } from './store/shared.reducer';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MetadataComponent } from './metadata/metadata.component';

@NgModule({
  declarations: [
    ButtonComponent,
    MobileMenuComponent,
    SidebarComponent,
    MainComponent,
    MainWrapperComponent,
    ContainerComponent,
    NavbarComponent,
    HeaderComponent,
    NotificationComponent,
    SingleActionCenteredComponent,
    BackdropComponent,
    WideButtonsCenteredComponent,
    WithButtonsComponent,
    WithDismissComponent,
    WithFooterComponent,
    AlertLeftAlignedButtonsComponent,
    ControlsComponent,
    SelectBrandedComponent,
    SelectNativeComponent,
    LinkSortableComponent,
    RemovableBadgeComponent,
    LoadingSpinnerComponent,
    MetadataComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    StoreModule.forFeature('shared', sharedReducer),
    EffectsModule.forFeature([SharedEffects]),

    TranslateModule.forRoot({
      defaultLanguage: 'de',
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => {
          return new TranslateHttpLoader(http, '/assets/translations/', '.json');
        },
        deps: [HttpClient]
      }
    }),
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    NgxPaginationModule,
    MatDialogModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule

  ],
  exports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    ContainerComponent,
    NotificationComponent,
    SingleActionCenteredComponent,
    WideButtonsCenteredComponent,
    WithButtonsComponent,
    WithDismissComponent,
    WithFooterComponent,
    AlertLeftAlignedButtonsComponent,
    ControlsComponent,
    SelectBrandedComponent,
    SelectNativeComponent,
    LinkSortableComponent,
    RemovableBadgeComponent,
    LoadingSpinnerComponent,
    MatDialogModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MetadataComponent,

  ],

  providers: [DatePipe,
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} }
  ]
})
export class SharedModule { }
