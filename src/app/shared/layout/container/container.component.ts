import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { selectIsSignedIn } from '@app/store/auth/auth.selectors';
import { ConfirmationModalComponent } from '@shared/dialog/confirmation-modal/confirmation-modal.component';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { MainWrapperComponent } from '@shared/layout/main-wrapper/main-wrapper.component';
import { NavbarComponent } from '@shared/layout/navbar/navbar.component';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [
    ConfirmationModalComponent,
    RouterLink,
    NgIf,
    TranslateModule,
    AsyncPipe,
    NgForOf,
    RouterLinkActive,
    MainWrapperComponent,
    NavbarComponent,
    NotificationComponent
  ],
  templateUrl: './container.component.html'
})
export class ContainerComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;

  availableLanguages = [
    { name: 'EN', value: 'en' },
    { name: 'DE', value: 'de' }
  ];
  menuOpen: boolean;
  showUserMenu: boolean = false;
  classUserMenuBtn: string = 'transition ease-out duration-100';
  confirmModal: boolean = false;

  constructor(
    private store: Store,
    private translate: TranslateService,
    private router: Router
  ) {
    this.isLoggedIn$ = store.pipe(select(selectIsSignedIn));
  }

  ngOnInit() {
    this.setDefaultLanguage();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  setDefaultLanguage() {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage?.length) {
      const language = JSON.parse(storedLanguage);
      this.translate.use(language);
    }
  }

  onLanguageChange(language: string) {
    localStorage.setItem('language', JSON.stringify(language));
    this.translate.use(language);
  }

  onMenuOpen(open?: boolean): void {
    this.menuOpen = open ?? !this.menuOpen;
    console.log(this.menuOpen);
  }

  signOutRequested(): void {
    this.confirmModal = true;
  }

  onModalResponse(event: boolean): void {
    if (event && this.confirmModal) {
      this.router.navigateByUrl('/logout');
    }
    this.confirmModal = false;
  }
}
