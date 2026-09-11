// src/app/components/register/register.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as bcrypt from 'bcryptjs';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { PopupComponent } from '../../popup/popup.component';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterModule,LoadingComponent,PopupComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.sass']
})
export class RegisterComponent {
  user = {
    username: '',
    name: '',
    surname: '',
    email: '',
    address: '',
    dni: '',
    telf: '',
    cp: '',
    pob: '',
    prov: '',
    pais: 'España',
    tdc: '',
    password: ''
  };

  showPassword: boolean = false;
  loading: boolean = false;
  showPopup: boolean = false;
  popupMessage: string = '';
  // Flag para determinar si tras aceptar se redirige (por registro exitoso) o se hace otra acción
  redirectOnAccept: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async register() {
    if (this.loading) return;

    this.loading = true;
    try {
      // Hashea la contraseña de forma asíncrona sin bloquear el hilo principal
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(this.user.password, saltRounds);

      // Prepara el payload con la contraseña hasheada
      const payload = {
        username: this.user.name ? `${this.user.name} ${this.user.surname}`.trim() : this.user.username,
        name: this.user.name,
        surname: this.user.surname,
        email: this.user.email,
        address: this.user.address,
        dni: this.user.dni,
        telf: this.user.telf,
        cp: this.user.cp,
        pob: this.user.pob,
        prov: this.user.prov,
        pais: this.user.pais || 'España',
        tdc: this.user.tdc,
        password: hashedPassword
      };

      console.log('Payload de registro:', payload);

      this.authService.register(payload).subscribe({
        next: () => {
          // Configura el mensaje y bandera para redirigir en el popup
          this.popupMessage = '¡Usuario registrado correctamente! Ya puedes iniciar sesión.';
          this.redirectOnAccept = true;
          this.showPopup = true;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al registrar el usuario:', err);
          this.popupMessage = 'Hubo un error al registrar el usuario. Por favor revisa los datos introducidos.';
          this.redirectOnAccept = false;
          this.showPopup = true;
          this.loading = false;
        }
      });
    } catch (e) {
      this.loading = false;
      this.popupMessage = 'Error al procesar la solicitud.';
      this.showPopup = true;
    }
  }

  // Función para manejar el clic en "Aceptar" del popup
  onPopupAccept() {
    this.showPopup = false;
    if (this.redirectOnAccept) {
      // Si se registró correctamente, redirige a login
      this.router.navigate(['/login']);
    }
    // En caso de error, simplemente se cierra el popup y se deja al usuario en el mismo formulario
  }
}
