import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

export interface OrderCreationResponse {
  success: boolean;
  pedidoId: number;
  orderNumber?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Registra un pedido confirmado contra erp-bridge-endpoint.php
   */
  createOrder(payload: any): Observable<OrderCreationResponse> {
    const url = this.apiUrl.includes('?')
      ? `${this.apiUrl}&action=create_order`
      : `${this.apiUrl}?action=create_order`;
    return this.http.post<OrderCreationResponse>(url, payload);
  }

  placeOrder(order: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, order);
  }
}
