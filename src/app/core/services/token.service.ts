import { Injectable } from '@angular/core';
import jwtDecode from 'jwt-decode';

export interface DecodedToken {
  aud: string;
  exp: number | null;
  iat: number | null;
  jti: string | null;
  nbf: string | null;
  scopes: [];
  sub: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  constructor() {}

  decodeToken(jwtToken: string | null): DecodedToken | null {
    if (!jwtToken) {
      return null;
    }
    return jwtDecode(jwtToken);
  }

  isTokenValid(jwtToken: string | null): boolean {
    const decodedToken = this.decodeToken(jwtToken);

    if (!decodedToken) {
      return false;
    }

    return this.isTokenExpired(decodedToken.exp);
  }

  isTokenExpired(expiryTime: number | null): boolean {
    if (!expiryTime) {
      return false;
    }

    return !Boolean(1000 * expiryTime - new Date().getTime() < 5000);
  }
}
