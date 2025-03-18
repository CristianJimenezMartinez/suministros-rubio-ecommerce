import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Endpoint de login en el backend
  private loginUrl = 'http://localhost:3000/api/login';
  private registerUrl = 'http://localhost:3000/api/createUser';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(this.loginUrl, { username, password });
  }

  logout(): void {
    localStorage.removeItem('user');
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('user');
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
      WEBPASS: user.password  // Se espera que la contraseña ya esté hasheada o se hashée en el backend
    };
    return this.http.post(this.registerUrl, payload);
  }
}
