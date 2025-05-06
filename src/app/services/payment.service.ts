// src/app/services/payment.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { PaymentIntent } from '@stripe/stripe-js';
import { environment } from '../../enviroments/environment';

export interface ShippingData {
  fullName:  string;
  address:   string;
  city:      string;
  postalCode:string;
  country:   string;
  phone:     string;
  email:     string;
}

export interface ProcessOrderPayload {
  order: any;
  paymentMethodId: string;       // para Stripe = PM_ID, para PayPal = orderID
  shippingData: ShippingData;
  shippingMethod: string;
  shippingCost: number;
  paymentMethodType: 'stripe' | 'paypal';
}

export interface ProcessOrderResponse {
  requiresAction?: boolean;
  clientSecret?: string;
  paymentIntent?: PaymentIntent;
  pedidoId?: number;  // si lo devuelves
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private url = `${environment.apiUrl}/payment/orders`;

  constructor(private http: HttpClient) {}

  processOrder(payload: ProcessOrderPayload): Observable<ProcessOrderResponse> {
    return this.http.post<ProcessOrderResponse>(this.url, payload);
  }
}
