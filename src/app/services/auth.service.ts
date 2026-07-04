// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../enviroments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // 1) Mantenemos un BehaviorSubject interno
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  // 2) Exponemos un observable para el header (y cualquier otro suscriptor)
  isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  private loginUrl = environment.apiUrl + '/login';
  private registerUrl = environment.apiUrl + '/createUser';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.loginUrl, { username, password }).pipe(
      tap(response => {
        if (response?.token && response?.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.isAuthenticatedSubject.next(true);  // emitimos el nuevo estado
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticatedSubject.next(false);
  }

  // Método síncrono por si en algún sitio quieres chequear rápido
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  register(user: any): Observable<any> {
    const payload = {
      NAME: user.username,
      SURNAME: user.surname,
      EMAIL: user.email,
      ADDRESS: user.address,
      DNI: user.dni,
      TELF: user.telf,
      CP: user.cp,
      POB: user.pob,
      PROV: user.prov,
      PAIS: user.pais,
      TDC: user.tdc,
      WEBPASS: user.password
    };
    return this.http.post(this.registerUrl, payload);
  }

  private hasToken(): boolean {
    // inicializamos el BehaviorSubject a true si ya había token en localStorage
    return !!localStorage.getItem('token');
  }
}
