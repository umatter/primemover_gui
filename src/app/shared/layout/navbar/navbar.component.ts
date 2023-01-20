import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectIsSignedIn } from '../../../store/auth/auth.selectors';
import { Observable } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

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

  constructor(private store: Store, private router: Router, private act: ActivatedRoute) {}

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
