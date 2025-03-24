import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'https://185.134.42.120:3000/api/orders'  // Ajusta la URL según tu configuración

  constructor(private http: HttpClient) {}

  placeOrder(order: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, order)
  }
}
