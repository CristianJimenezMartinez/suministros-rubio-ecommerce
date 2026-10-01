// src/app/services/payment.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/environment';

export interface ShippingData {
  fullName:   string;
  address:    string;
  city:       string;
  postalCode: string;
  country:    string;
  phone:      string;
  email:      string;
  province?:  string;
  nif?:       string;
}

export type PaymentMethodType = 'paypal' | 'stripe' | 'redsys';

export interface ProcessOrderPayload {
  order: any;
  paymentMethodId: string;
  shippingData: ShippingData;
  shippingMethod: string;
  shippingCost: number;
  paymentMethodType: PaymentMethodType;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string;
  lines?: any[];
  subtotal?: number;
  taxTotal?: number;
  total?: number;
  raw?: any;
}

export interface ProcessOrderResponse {
  success?: boolean;
  pedidoId?: number;
  orderNumber?: string;
  message?: string;
  rawResult?: any;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private endpointUrl = environment.apiUrl.includes('?')
    ? `${environment.apiUrl}&action=create_order`
    : `${environment.apiUrl}?action=create_order`;

  constructor(private http: HttpClient) {}

  /**
   * Procesa la orden llamando a erp-bridge-endpoint.php con action=create_order
   */
  processOrder(payload: ProcessOrderPayload): Observable<ProcessOrderResponse> {
    const formattedPayload = {
      ...payload,
      paymentMethod: payload.paymentMethod || payload.paymentMethodType || 'paypal',
      paymentMethodType: payload.paymentMethodType || 'paypal',
      paymentStatus: payload.paymentStatus || 'COMPLETED',
      paymentReference: payload.paymentReference || payload.paymentMethodId
    };
    return this.http.post<ProcessOrderResponse>(this.endpointUrl, formattedPayload);
  }
}
