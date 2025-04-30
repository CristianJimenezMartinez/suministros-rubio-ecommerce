import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNgxStripe } from 'ngx-stripe';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '../enviroments/environment';

const socketConfig: SocketIoConfig = {
  url: environment.apiUrl,    // ej. 'https://tu-dominio.com'
  options: {}
};


export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),provideHttpClient(),
    provideNgxStripe('pk_test_51R3DczE3oVRVCHqc5ZLTK0WazqUlqf9UdtYYSaqHBO2nql400HIqlydjgdWzFkL1u0QB9wiRqlqDizE8w5HTM9SN00yF3vgCYW'),
    importProvidersFrom(
      SocketIoModule.forRoot(socketConfig)
    )
  ],
};
