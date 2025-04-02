import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { ArticulosComponent } from './articulos/articulos.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HomeComponent } from "./home/home.component";
import { CategoriaComponent } from './categoria/categoria.component';
import { TokenInterceptor } from './interceptor/token.interceptor'; 

import { Category } from './models/articles';
import { CartComponent } from './cart/cart.component';
import { FooterComponent } from "./footer/footer.component";

@Component({
    selector: 'app-root',
    imports: [
    CommonModule,
    HeaderComponent,
    ArticulosComponent,
    CartComponent,
    HttpClientModule,
    CategoriaComponent,
    RouterModule,
    FooterComponent
],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.sass'],
    standalone: true
})
export class AppComponent {
  
  title = 'Suministros Rubio';
  showHome: boolean = true;

  // Asegúrate de que selectedCategory nunca sea null
  selectedCategory: Category = { 
    id: 1, 
    name: "Agua", 
    image: "assets/img/agua.jpg", 
    fam: ['1', '2', '3']
  };

  constructor(private router: Router) {}

  onViewCategory(category: any): void {
    // Convertir los elementos de fam a string[] si es necesario
    this.selectedCategory = category;  // Asignar la categoría convertida
    this.showHome = false;  // Cambiar la vista
  }
}
