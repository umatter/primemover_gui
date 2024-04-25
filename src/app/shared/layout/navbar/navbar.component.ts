import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectIsSignedIn } from '@app/store/auth/auth.selectors';
import { Observable } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  imports: [NgClass, RouterLink, RouterLinkActive, TranslateModule],
  standalone: true
})
export class NavbarComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;
  currentRoute: string;
  selectedRoute = '';
  regularClassList: string =
    'text-indigo-100 text-sm font-medium rounded-md bg-white bg-opacity-0 px-3 py-2 hover:bg-opacity-10';
  activeClassList: string =
    'text-white text-sm font-medium rounded-md bg-white bg-opacity-0 px-3 py-2 hover:bg-opacity-10';

  constructor(
    private store: Store,
    private router: Router
  ) {
    this.currentRoute = router.url;
  }

  ngOnInit(): void {
    this.isLoggedIn$ = this.store.select(selectIsSignedIn);
    this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) {
        return;
      }
      this.currentRoute = event.url;
    });
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
}
