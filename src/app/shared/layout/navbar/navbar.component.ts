import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectIsSignedIn } from '../../../store/auth/auth.selectors';
import { Observable } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;
  currentRoute: string;
  regularClassList: string =
    'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium';
  activeClassList: string = 'bg-gray-900 text-white hover px-3 py-2 rounded-md text-sm font-medium';

  constructor(private store: Store, private router: Router) {}

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
    return this.isActiveRoute('/') || this.isActiveRoute('/home');
  }

  isLoginRoute(): boolean {
    return this.isActiveRoute('/login');
  }
}
