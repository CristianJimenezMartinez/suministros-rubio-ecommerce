import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNgxStripe } from 'ngx-stripe';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '../enviroments/environment';

const socketConfig: SocketIoConfig = {
  url: environment.apiUrl,    
  options: {}
};


export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),provideHttpClient(),
    provideNgxStripe('pk_test_51R538tFf4swcvg5iad5Y2LQM6o8MIwKB0CnCpHTexJ7mKzXZz2FQXwGvQu7HyTgTIerL95m82ZOKL2gsC15473Mg005pdv5BP0'),
    importProvidersFrom(
      SocketIoModule.forRoot(socketConfig)
    )
  ],
};
