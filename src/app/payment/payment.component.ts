import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { StripeService, StripeCardComponent, NgxStripeModule } from 'ngx-stripe';
import {
  StripeCardElementOptions,
  StripeElementsOptions,
  CreatePaymentMethodCardData
} from '@stripe/stripe-js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxStripeModule
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.sass'],
})
export class PaymentComponent implements OnInit {
  @ViewChild(StripeCardComponent) card!: StripeCardComponent;

  @Input() cartItems: any[] = [];
  @Input() order!: any;
  @Input() shippingData!: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  @Input() shippingMethod!: string;
  @Input() shippingCost!: number;

  @Output() paymentConfirmed = new EventEmitter<any>();
  @Output() paymentError     = new EventEmitter<string>();
  @Output() cancel           = new EventEmitter<void>();

  processing = false;
  errorMessage = '';

  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#000',
        color: '#000',
        lineHeight: '40px',
        fontWeight: '300',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        '::placeholder': { color: '#aab7c4' }
      }
    }
  };
  elementsOptions: StripeElementsOptions = { locale: 'es' };

  constructor(
    private stripeService: StripeService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    console.log('PaymentComponent inputs:', {
      cartItems: this.cartItems,
      order: this.order,
      shippingData: this.shippingData,
      shippingMethod: this.shippingMethod
    });
  }

  pay(): void {
    this.processing = true;
    this.errorMessage = '';

    const pmData = {
      type: 'card',
      card: this.card.element,
      billing_details: {
        name: this.shippingData.fullName,
        email: this.shippingData.email,
        phone: this.shippingData.phone
      }
    } as CreatePaymentMethodCardData;

    this.stripeService.createPaymentMethod(pmData).subscribe(pmResult => {
      if (pmResult.error) {
        this.processing = false;
        const msg = pmResult.error.message || 'Error al crear PaymentMethod';
        this.paymentError.emit(msg);
        return;
      }

      const paymentMethod = pmResult.paymentMethod!;
      this.paymentService.processOrder({
        order: this.order,
        paymentMethodId: paymentMethod.id,
        shippingData: this.shippingData,
        shippingMethod: this.shippingMethod,
        shippingCost: this.shippingCost
      }).subscribe(async backendRes => {
        if (backendRes.requiresAction) {
          const clientSecret = backendRes.clientSecret!;
          try {
            this.processing = true;
            const confirmResult = await this.stripeService.confirmCardPayment(clientSecret).toPromise();
            if (confirmResult?.error) throw confirmResult.error;
            if (confirmResult?.paymentIntent?.status === 'succeeded') {
              this.emitSuccess(paymentMethod, confirmResult.paymentIntent);
            } else {
              throw new Error('3D-Secure no completado');
            }
          } catch (err: any) {
            this.paymentError.emit(err.message || 'Error en autenticación 3D-Secure');
          } finally {
            this.processing = false;
          }
        } else {
          this.emitSuccess(paymentMethod, backendRes.paymentIntent!);
        }
        console.log(this.shippingCost)
      }, err => {
        this.processing = false;
        this.paymentError.emit(err.error?.message || 'Error procesando la orden');
      });
    });
  }

  private emitSuccess(paymentMethod: any, paymentIntent: any) {
    this.processing = false;
    this.paymentConfirmed.emit({ paymentMethod, paymentIntent });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
