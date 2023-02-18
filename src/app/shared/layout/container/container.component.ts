import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectIsSignedIn } from '../../../store/auth/auth.selectors';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html'
})
export class ContainerComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;

  availableLanguages = [
    { name: 'EN', value: 'en' },
    { name: 'DE', value: 'de' }
  ];
  menuOpen: boolean;

  constructor(private store: Store, private translate: TranslateService) {
    this.isLoggedIn$ = store.pipe(select(selectIsSignedIn));
  }

  ngOnInit() {
    this.setDefaultLanguage();
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
}
