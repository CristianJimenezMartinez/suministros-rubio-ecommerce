import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { StripeService, StripeCardComponent, NgxStripeModule } from 'ngx-stripe'
import { StripeCardElementOptions, StripeElementsOptions, CreatePaymentMethodCardData } from '@stripe/stripe-js'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component({
    selector: 'app-payment',
    imports: [CommonModule, FormsModule, NgxStripeModule],
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.sass'],
    standalone: true
})
export class PaymentComponent implements OnInit {
  @ViewChild(StripeCardComponent) card!: StripeCardComponent

  @Output() paymentConfirmed = new EventEmitter<void>()
  @Output() cancel = new EventEmitter<void>()

  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#000000',
        color: '#000000',
        lineHeight: '40px',
        fontWeight: 300,
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        '::placeholder': {
          color: '#aab7c4'
        }
      }
    }
  };

  elementsOptions: StripeElementsOptions = {
    locale: 'es'
  };

  errorMessage: string = '';
  processing: boolean = false;

  constructor(private stripeService: StripeService) {}

  ngOnInit(): void {}

  pay(): void {
    this.processing = true;
    const paymentData = {
      type: 'card',
      card: this.card.element,
      billing_details: {
        name: 'Customer Name'
      }
    } as CreatePaymentMethodCardData

    this.stripeService
      .createPaymentMethod(paymentData)
      .subscribe(result => {
        this.processing = false;
        if (result.error) {
          this.errorMessage = result.error.message || 'Error al procesar el pago';
          console.error('Error al crear PaymentMethod:', result.error);
        } else {
          console.log('PaymentMethod creado:', result.paymentMethod);
          // Aquí enviarías result.paymentMethod.id al backend para procesar el cargo.
          // Si el pago se procesa correctamente, emites el evento:
          this.paymentConfirmed.emit();
        }
      });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
