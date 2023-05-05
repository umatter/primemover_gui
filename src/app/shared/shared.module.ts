import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
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
import { EffectsModule } from '@ngrx/effects';
import { SharedEffects } from './store/shared.effects';
import { sharedReducer } from './store/shared.reducer';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MetadataComponent } from './metadata/metadata.component';
import { ConfirmationPrimeoverDialogComponent } from './dialog/primeover-dialog/confirmation-primeover-dialog.component';
import { euFormat } from './pipes/datepipe/date-pipe.pipe';
import { ConfirmationModalComponent } from './dialog/confirmation-modal/confirmation-modal.component';
import { ContentModalComponent } from '@shared/dialog/content-modal/content-modal.component';
import { AutocompleteSelectComponent } from '@shared/autocomplete-select/autocomplete-select.component';
import { HeroiconTrashComponent } from './icon/heroicon-trash/heroicon-trash.component';
import { HeroiconPlusComponent } from './icon/heroicon-plus/heroicon-plus.component';
import { HeroiconClipboardDocumentComponent } from './icon/heroicon-clipboard-document/heroicon-clipboard-document.component';
import { HeroiconUploadComponent } from './icon/heroicon-upload/heroicon-upload.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { HeroiconPencilSquareComponent } from './icon/heroicon-pencil-square/heroicon-pencil-square.component';

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
    ConfirmationPrimeoverDialogComponent,
    euFormat,
    ConfirmationModalComponent,
    ContentModalComponent,
    AutocompleteSelectComponent,
    HeroiconTrashComponent,
    HeroiconPlusComponent,
    HeroiconClipboardDocumentComponent,
    HeroiconUploadComponent,
    FileUploadComponent,
    HeroiconPencilSquareComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    StoreModule.forFeature('shared', sharedReducer),
    EffectsModule.forFeature([SharedEffects]),

    TranslateModule,
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
    MatProgressSpinnerModule,
    MatSlideToggleModule
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
    MatSlideToggleModule,
    MetadataComponent,
    ConfirmationPrimeoverDialogComponent,
    euFormat,
    ConfirmationModalComponent,
    ContentModalComponent,
    AutocompleteSelectComponent,
    HeroiconTrashComponent,
    HeroiconPlusComponent,
    HeroiconClipboardDocumentComponent,
    HeroiconUploadComponent,
    FileUploadComponent,
    HeroiconPencilSquareComponent
  ]
})
export class SharedModule {}
