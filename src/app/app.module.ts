import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '@environments/environment';
import { AppConfig } from './app-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppStoreModule } from './store/store.module';
import { SharedModule } from '@shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { authReducer } from './store/auth/auth.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { TokenInterceptor } from '@core/interceptors/token.interceptor';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { Language, LanguageFilePath } from 'src/app/core/language/language.enum';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import {
  DefaultDataServiceConfig,
  EntityCollectionReducerMethodsFactory,
  EntityDataModule,
  HttpUrlGenerator,
  PersistenceResultHandler
} from '@ngrx/data';
import { defaultDataServiceConfig, entityConfig } from './entity/metadata';
import { CustomHttpUrlGenerator } from './entity/custom-http-url.generator';
import { AdditionalPersistenceResultHandler } from './entity/persistence.handler';
import { AdditionalEntityCollectionReducerMethodsFactory } from './entity/reducer.methods';
import { ContainerComponent } from '@shared/layout/container/container.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ErrorInterceptor } from '@shared/error-handler/error.interceptor';
import { CustomHandlerService } from '@shared/error-handler/custom-handler.service';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppStoreModule,
    SharedModule,
    ContainerComponent,
    AsyncPipe,
    NgIf,
    RouterOutlet,
    NotificationComponent,
    StoreModule.forFeature('auth', authReducer),
    EffectsModule.forFeature([AuthEffects]),
    TranslateModule.forRoot({
      defaultLanguage: Language.EN,
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) => {
          return new TranslateHttpLoader(http, LanguageFilePath.ASSETI18N, LanguageFilePath.EXTENSION);
        },
        deps: [HttpClient]
      }
    }),
    StoreModule.forRoot({}),
    EffectsModule.forRoot([]),
    EntityDataModule.forRoot(entityConfig),
    StoreDevtoolsModule.instrument({ maxAge: 25, logOnly: environment.production })
  ],
  providers: [
    {
      provide: HttpUrlGenerator,
      useClass: CustomHttpUrlGenerator
    },
    {
      provide: DefaultDataServiceConfig,
      useValue: defaultDataServiceConfig
    },
    {
      provide: PersistenceResultHandler,
      useClass: AdditionalPersistenceResultHandler
    },
    {
      provide: EntityCollectionReducerMethodsFactory,
      useClass: AdditionalEntityCollectionReducerMethodsFactory
    },
    {
      provide: AppConfig,
      useValue: environment.configService
    },

    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: ErrorInterceptor,
    //   multi: true
    // },
    {
      provide: ErrorHandler,
      useClass: CustomHandlerService
    },
    {
      multi: true,
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
