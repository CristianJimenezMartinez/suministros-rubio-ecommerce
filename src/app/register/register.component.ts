// src/app/components/register/register.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as bcrypt from 'bcryptjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.sass']
})
export class RegisterComponent {
  user = {
    username: '',
    surname: '',
    email: '',
    address: '',
    dni: '',
    telf: '',
    cp: '',
    pob: '',
    prov: '',
    pais: '',
    tdc: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    console.log("entra")
    // Hashea la contraseña antes de enviarla
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(this.user.password, saltRounds);

    // Prepara el payload con el password ya encriptado
    const payload = {
      username: this.user.username,
      surname: this.user.surname,
      email: this.user.email,
      address: this.user.address,
      dni: this.user.dni,
      telf: this.user.telf,
      cp: this.user.cp,
      pob: this.user.pob,
      prov: this.user.prov,
      pais: this.user.pais,
      tdc: this.user.tdc,
      password: hashedPassword
    };
    console.log(payload)

    this.authService.register(payload).subscribe({
      next: () => {
        alert('Usuario registrado con éxito');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al registrar el usuario:', err);
        alert('Hubo un error al registrar el usuario');
      }
    });
  }
}
