// src/app/payment/payment.component.ts
import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentMethodType } from '../../services/payment.service';
import { OrderService } from '../../services/order.service';
import { environment } from '../../../enviroments/environment';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { LoadingService } from '../../services/loading.service';


@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.sass'],
})
export class PaymentComponent implements OnInit {
  @Input() cartItems: any[] = [];
  @Input() order!: any;
  @Input() shippingData!: any;
  @Input() shippingMethod!: string;
  @Input() shippingCost!: number;

  @Output() paymentConfirmed = new EventEmitter<{
    paymentMethodId: string;
    raw?: any;
    paymentMethodType: PaymentMethodType;
    orderResponse?: any;
  }>();
  @Output() paymentError = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  selectedMethod: 'paypal' = 'paypal';

  private paypalSdkLoaded = false;
  private paypalRendered  = false;

  processing = false;
  errorMessage = '';

  constructor(
    private orderService: OrderService,
    private loading: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadPayPalSdk();
  }

  selectMethod(method: 'paypal') {
    this.selectedMethod = method;
    this.loadPayPalSdk();
  }

  // ─── PAYPAL ─────────────────────────────────────────
  private loadPayPalSdk() {
    if (window.paypal) {
      this.tryRenderPayPalButtons();
      return;
    }
    if (this.paypalSdkLoaded) {
      this.tryRenderPayPalButtons();
      return;
    }
    this.paypalSdkLoaded = true;
    const scr = document.createElement('script');
    scr.src = `https://www.paypal.com/sdk/js?client-id=${environment.paypalClientId}&currency=EUR`;
    scr.onload = () => this.tryRenderPayPalButtons();
    document.body.appendChild(scr);
  }

  private tryRenderPayPalButtons() {
    if (this.paypalRendered) return;
    const container = document.getElementById('paypal-button-container');
    if (!container) {
      setTimeout(() => this.tryRenderPayPalButtons(), 50);
      return;
    }
    container.innerHTML = '';
    window.paypal.Buttons({
      onClick: (_data: unknown, _actions: any) => {
        this.loading.show();
        this.errorMessage = '';
      },

      createOrder: (_data: unknown, actions: any) => {
        const net = Number(this.order?.cabecera?.net1pcl) || 0;
        const vat = Number(this.order?.cabecera?.iiva1pcl) || 0;
        const ship = Number(this.shippingCost) || 0;
        const total = Number(this.order?.cabecera?.totpcl) || (net + vat);
        const amount = (total + ship).toFixed(2);
        return actions.order.create({
          purchase_units: [{ amount: { currency_code: 'EUR', value: amount } }]
        });
      },

      onApprove: async (_data: unknown, actions: any) => {
        try {
          const capture = await actions.order.capture();
          const net = Number(this.order?.cabecera?.net1pcl) || 0;
          const vat = Number(this.order?.cabecera?.iiva1pcl) || 0;
          const ship = Number(this.shippingCost) || 0;
          const total = Number(this.order?.cabecera?.totpcl) || (net + vat);

          const payload = {
            order: this.order,
            lines: this.order?.lineas || this.order?.lines || [],
            shippingData: this.shippingData,
            shippingMethod: this.shippingMethod,
            shippingCost: ship,
            paymentMethod: 'paypal',
            paymentMethodType: 'paypal',
            paymentStatus: 'COMPLETED',
            paymentMethodId: capture.id,
            paymentReference: capture.id,
            subtotal: net,
            taxTotal: vat,
            total: parseFloat((total + ship).toFixed(2)),
            raw: capture
          };

          this.orderService.createOrder(payload).subscribe({
            next: (orderResp) => {
              this.loading.hide();
              this.onSuccess(capture.id, capture, orderResp);
            },
            error: (err) => {
              this.loading.hide();
              this.paymentError.emit(
                err?.error?.message || err?.message || 'Error registrando el pedido en el servidor'
              );
            }
          });
        } catch (err: any) {
          this.loading.hide();
          this.paymentError.emit(err?.message || 'Error capturando PayPal');
        }
      },

      onError: (err: any) => {
        this.loading.hide();
        this.paymentError.emit(err?.message || 'Error PayPal');
      },

      onCancel: () => {
        this.loading.hide();
      }
    }).render('#paypal-button-container');

    this.paypalRendered = true;
  }

  private onSuccess(paymentMethodId: string, raw: any, orderResponse?: any) {
    this.paymentConfirmed.emit({
      paymentMethodId,
      raw,
      paymentMethodType: 'paypal',
      orderResponse
    });
  }

  onCancel() {
    this.loading.hide();
    this.cancel.emit();
  }
}
