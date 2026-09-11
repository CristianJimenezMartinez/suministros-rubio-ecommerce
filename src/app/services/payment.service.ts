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

export type PaymentMethodType = 'stripe' | 'paypal' | 'redsys';
export interface ProcessOrderPayload {
  order: any;
  paymentMethodId: string;
  shippingData: ShippingData;
  shippingMethod: string;
  shippingCost: number;
  paymentMethodType: PaymentMethodType;
}

export interface ProcessOrderResponse {
  requiresAction?: boolean;
  clientSecret?: string;
  rawResult?: any;
  paymentIntent?: PaymentIntent;
  pedidoId?: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  // antigua URL de Stripe/PayPal:
  private stripePaypalUrl = `${environment.apiUrl}/payment/orders`;
  // nueva URL genérica de pasarelaGlobal:
  private globalUrl        = `${environment.apiUrl}/pasarelaGlobal/pay`;

  constructor(private http: HttpClient) {}

  /** Sigue usando este método para Stripe y PayPal */
  processOrder(payload: ProcessOrderPayload): Observable<ProcessOrderResponse> {
    return this.http.post<ProcessOrderResponse>(this.stripePaypalUrl, payload);
  }

  /** Nuevo: usa el endpoint genérico para Redsys (u otras pasarelas adicionales) */
  processGlobal(payload: ProcessOrderPayload): Observable<{ success: boolean; pedidoId: number; rawResult: any }> {
    return this.http.post<{ success: boolean; pedidoId: number; rawResult: any }>(this.globalUrl, payload);
  }
}
