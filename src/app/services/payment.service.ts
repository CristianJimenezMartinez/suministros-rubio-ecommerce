// src/app/services/payment.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// Importa el tipo en lugar del namespace
import type { PaymentIntent } from '@stripe/stripe-js';
import { environment } from '../../enviroments/environment';

export interface ShippingData {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

export interface ProcessOrderPayload {
  order: any;
  paymentMethodId: string;
  shippingData: ShippingData;
  shippingCost: number,
  shippingMethod: string;
}

export interface ProcessOrderResponse {
  requiresAction?: boolean;
  clientSecret?: string;
  // usa directamente el tipo importado
  paymentIntent?: PaymentIntent;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private processOrderUrl = `${environment.apiUrl}/payment/orders`;
  private notifyPaymentUrl  = `${environment.apiUrl}/payment`;

  constructor(private http: HttpClient) {}

  processOrder(payload: ProcessOrderPayload): Observable<ProcessOrderResponse> {
    return this.http.post<ProcessOrderResponse>(this.processOrderUrl, payload);
  }

  notifyPayment(notificationData: { codfac: number; nuevoEstado: string; token: string }): Observable<any> {
    return this.http.post<any>(this.notifyPaymentUrl, notificationData);
  }
}
