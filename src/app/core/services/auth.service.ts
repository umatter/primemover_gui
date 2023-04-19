import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../../store/auth/auth.actions';
import { AppConfig } from '../../app-config';

export interface OAuthResource {
  token_type: string | null;
  expires_in: number | null;
  access_token: string;
  refresh_token: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http: HttpClient, private config: AppConfig) {}

  public createToken(username: string, password: string): Observable<OAuthResource> {
    return this.http.post<OAuthResource>(`${this.config.apiBaseUrl}/auth/token`, {
      username,
      password
    });
  }

  public forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.config.apiBaseUrl}/forgot-password`, {
      email
    });
  }

  public resetPassword(token: string | null, email: string, password: string, password_confirmation: string): Observable<any> {
    return this.http.post(`${this.config.apiBaseUrl}/reset-password`, {
      token,
      email,
      password,
      password_confirmation
    })
  }

  public user(): Observable<User> {
    return this.http.get<User>(`${this.config.apiBaseUrl}/auth/user`);
  }
}
