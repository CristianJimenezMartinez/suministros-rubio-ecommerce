import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { LoadingService } from './services/loading.service';
import { environment } from '../enviroments/environment';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { TokenInterceptor } from './interceptor/token.interceptor'; 

import { Category } from './models/articles';

import { FooterComponent } from "./shared/footer/footer.component";
import { CookieBannerComponent } from './shared/footer/cookie-banner/cookie-banner.component';
import { Observable } from 'rxjs';
import { LoadingComponent } from './shared/loading/loading.component';
import { LoadingInterceptor } from './interceptor/loading.interceptor';



@Component({
    selector: 'app-root',
    imports: [
    CommonModule,
    HeaderComponent,
    HttpClientModule,
    RouterModule,
    FooterComponent,
    CookieBannerComponent,
    LoadingComponent
],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true }
        
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.sass'],
    standalone: true
})
export class AppComponent {
  loading$: Observable<boolean>;
  
  title = 'Suministros Rubio';
  showHome: boolean = true;

  selectedCategory: Category = { 
    id: 1, 
    name: "Agua", 
    image: "assets/img/agua.jpg", 
    fam: ['1', '2', '3']
  };

  constructor(private loadingService: LoadingService) {
    this.loading$ = this.loadingService.isLoading;
  }

  onViewCategory(category: any): void {
    // Convertir los elementos de fam a string[] si es necesario
    this.selectedCategory = category;  // Asignar la categoría convertida
    this.showHome = false;  // Cambiar la vista
  }
}
