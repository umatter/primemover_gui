import { Component, OnInit } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { Store } from '@ngrx/store';
import { logoutCompleted, logoutRequested } from '../../../store/auth/auth.actions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html'
})
export class LogoutComponent implements OnInit {
  constructor(private localStorageService: LocalStorageService, private store: Store, private router: Router) {}

  ngOnInit(): void {
    this.store.dispatch(logoutRequested());
    this.localStorageService.remove('accessToken');
    this.router.navigateByUrl('login').then(() => this.store.dispatch(logoutCompleted()));
  }
}
