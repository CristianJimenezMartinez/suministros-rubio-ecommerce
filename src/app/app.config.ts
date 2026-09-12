import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNgxStripe } from 'ngx-stripe';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '../enviroments/environment';
import { TokenInterceptor } from './interceptor/token.interceptor';
import { LoadingInterceptor } from './interceptor/loading.interceptor';

const socketConfig: SocketIoConfig = {
  url: environment.apiUrl,    
  options: {}
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    provideNgxStripe('pk_test_51R538tFf4swcvg5iad5Y2LQM6o8MIwKB0CnCpHTexJ7mKzXZz2FQXwGvQu7HyTgTIerL95m82ZOKL2gsC15473Mg005pdv5BP0'),
    importProvidersFrom(
      SocketIoModule.forRoot(socketConfig)
    )
  ],
};
