import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.sass']
})
export class ProfileComponent {

  constructor(private router: Router) {}

  // Simula el cerrar sesión
  logout() {
    // Cambiar el estado de logueado a false
    // Puedes agregar lógica para borrar el token o limpiar el estado de la sesión
    this.router.navigate(['/']);  // Redirige a la página de inicio
  }

  // Navegar a la página de perfil
  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  // Navegar a la página de configuración
  navigateToSettings() {
    this.router.navigate(['/settings']);
  }
}
