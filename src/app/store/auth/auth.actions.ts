import { createAction, props } from '@ngrx/store';
import { OAuthResource } from '../../core/services/auth.service';

export interface User {
  id: number | null;
  name: string | null;
  email: string | null;
  email_verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  photo_url: string | null;
}

export const updateUserRequested = createAction('[Auth] Update user requested', props<{ user: User }>());

export const logoutRequested = createAction('[Auth] Sign out requested');
export const logoutCompleted = createAction('[Auth] Sign out completed');

export const useTokenFromLocalStorageRequested = createAction(
  '[Auth] Use local storage token',
  props<{ token: string | null }>()
);

export const signInRequested = createAction(
  '[Auth] Sign in requested',
  props<{ username: string; password: string }>()
);
export const signInCompleted = createAction('[Auth] Sign in completed', props<{ token: string | null }>());

export const redirectToLoginRequested = createAction('[Auth] Redirect to login requested');

export const redirectToHomeRequested = createAction('[Auth] Redirect to home requested');

export const authGuardPassed = createAction('[Auth] Guard passed');
export const validLocalStorageTokenFound = createAction('[Auth] Local storage has valid token');
export const validLocalTokenFound = createAction('[Auth] Store has valid token');
export const noLocalStorageTokenFound = createAction('[Auth] No local storage token found');
export const invalidLocalStorageTokenFound = createAction(
  '[Auth] Invalid or expired local storage token found',
  props<{ token: string | null }>()
);
export const updateLocalStorageTokenRequested = createAction('[Auth] Update local storage token requested');

export const signInFailed = createAction('[Auth] Sign in failed', props<{ error: any }>());

export const missingCredentialsUsername = createAction('[Auth] Sign in username missing');
export const missingCredentialsPassword = createAction('[Auth] Sign in password missing');

export const fetchUserDataSuccess = createAction('[Auth] Fetch User Data Success', props<{user: any}>())
export const fetchUserDataFailed = createAction('[Auth] Fetch User Data Failed', props<{error: any}>())
