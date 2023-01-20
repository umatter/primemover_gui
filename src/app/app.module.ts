import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { environment } from '../environments/environment';
import { AppConfig } from './app-config';
import { LoginComponent } from './core/auth/login/login.component';
import { HomeComponent } from './home/component/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppStoreModule } from './store/store.module';
import { SharedModule } from './shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de-CH';
import localeFr from '@angular/common/locales/fr-CH';
import localeIt from '@angular/common/locales/it-CH';
import { Language } from './core/language/language.enum';
import { LogoutComponent } from './core/auth/logout/logout.component';
// import { ConfigModule } from './config/config.module';

registerLocaleData(localeDe, Language.DE);
registerLocaleData(localeFr, Language.FR);
registerLocaleData(localeIt, Language.IT);

@NgModule({
  declarations: [AppComponent, LoginComponent, HomeComponent, LogoutComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppStoreModule,
    SharedModule,
    StoreModule.forFeature('auth', authReducer),
    EffectsModule.forFeature([AuthEffects])
  ],
  providers: [
    {
      provide: AppConfig,
      useValue: environment.configService
    },
    {
      provide: LOCALE_ID,
      useValue: Language.DE
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    {
      provide: LOCALE_ID,
      useValue: 'de'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
