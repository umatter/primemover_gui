import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectIsSignedIn } from '../../../store/auth/auth.selectors';
import { Observable } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Language } from 'src/app/core/language/language.enum';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;
  currentRoute: string;
  selectedRoute = '';
  regularClassList: string = 'text-gray-300 hover:bg-black px-3 py-2 rounded-md text-sm font-medium';
  activeClassList: string = 'text-gray-300 px-3 py-2 rounded-md text-sm font-medium bg-black';
  selectedLanguage: string;

  availableLanguages = [
    { name: 'English', value: 'en' },
    { name: 'German', value: 'de' }
  ];

  constructor(private store: Store, private router: Router, private translate: TranslateService) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.store.select(selectIsSignedIn);
    this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) {
        return;
      }
      this.currentRoute = event.url;
    });

    this.setDefaultLanguage();
  }

  setDefaultLanguage() {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage?.length) {
      const language = JSON.parse(storedLanguage);
      this.translate.use(language);
      this.selectedLanguage = language;
    } else {
      this.selectedLanguage = Language.EN;
    }
  }

  isActiveRoute(routeName: string): boolean {
    return this.currentRoute === routeName;
  }

  isHomeRoute(): boolean {
    return this.isActiveRoute('/') || this.isActiveRoute('/home') || this.isActiveRoute('/experiments');
  }

  isLoginRoute(): boolean {
    return this.isActiveRoute('/login');
  }
  onLanguageChange() {
    localStorage.setItem('language', JSON.stringify(this.selectedLanguage));
    this.translate.use(this.selectedLanguage);
  }
}
