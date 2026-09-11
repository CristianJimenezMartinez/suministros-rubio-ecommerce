// app.routes.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Suministros Rubio - Tienda Online de Riego, Solar y Electricidad' },
  { path: 'home', component: HomeComponent, title: 'Suministros Rubio - Tienda Online de Riego, Solar y Electricidad' },
  { 
    path: 'categorias/:sec', 
    loadComponent: () => import('./shop/categoria/categoria.component').then(m => m.CategoriaComponent),
    title: 'Categorías - Suministros Rubio'
  },
  { 
    path: 'categorias', 
    loadComponent: () => import('./shop/categoria/categoria.component').then(m => m.CategoriaComponent),
    title: 'Categorías - Suministros Rubio'
  },
  { 
    path: 'articulos/:fam', 
    loadComponent: () => import('./shop/articulos/articulos.component').then(m => m.ArticulosComponent),
    title: 'Catálogo de Artículos - Suministros Rubio'
  },
  { 
    path: 'articulos', 
    loadComponent: () => import('./shop/articulos/articulos.component').then(m => m.ArticulosComponent),
    title: 'Catálogo de Artículos - Suministros Rubio'
  },
  { 
    path: 'login', 
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    title: 'Iniciar Sesión - Suministros Rubio'
  },
  { 
    path: 'register', 
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Crear Cuenta - Suministros Rubio'
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./user/profile/profile.component').then(m => m.ProfileComponent), 
    canActivate: [AuthGuard],
    title: 'Mi Perfil - Suministros Rubio'
  },
  { 
    path: 'checkout', 
    loadComponent: () => import('./shop/checkout/checkout.component').then(m => m.CheckoutComponent),
    title: 'Finalizar Compra - Suministros Rubio'
  },
  { 
    path: 'contacto', 
    loadComponent: () => import('./info/contacto/contacto.component').then(m => m.ContactoComponent),
    title: 'Contacto y Localización - Suministros Rubio'
  },
  { 
    path: 'sobre-nosotros', 
    loadComponent: () => import('./info/sobre-nosotros/sobre-nosotros.component').then(m => m.SobreNosotrosComponent),
    title: 'Sobre Nosotros - Suministros Rubio'
  },
  { 
    path: 'politica-privacidad', 
    loadComponent: () => import('./shared/footer/politica-privacidad/politica-privacidad.component').then(m => m.PoliticaPrivacidadComponent),
    title: 'Política de Privacidad - Suministros Rubio'
  },
  { 
    path: 'politica-cookies', 
    loadComponent: () => import('./shared/footer/cookie-policy/cookie-policy.component').then(m => m.CookiePolicyComponent),
    title: 'Política de Cookies - Suministros Rubio'
  },
  { 
    path: 'condiciones-compra', 
    loadComponent: () => import('./info/condiciones-compra/condiciones-compra.component').then(m => m.CondicionesCompraComponent),
    title: 'Condiciones de Compra - Suministros Rubio'
  },
  { 
    path: 'riego-solar', 
    loadComponent: () => import('./info/riego-solar/riego-solar.component').then(m => m.RiegoSolarComponent),
    title: 'Riego Solar Eficiente - Suministros Rubio'
  },
  { 
    path: 'seguridad-homologada', 
    loadComponent: () => import('./info/seguridad-homologada/seguridad-homologada.component').then(m => m.SeguridadHomologadaComponent),
    title: 'Seguridad Homologada y Alarmas - Suministros Rubio'
  },
  { 
    path: 'enlaces-inalambricos', 
    loadComponent: () => import('./info/enlaces-inalambricos/enlaces-inalambricos.component').then(m => m.EnlacesInalambricosComponent),
    title: 'Enlaces Inalámbricos y WiFi Rural - Suministros Rubio'
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
