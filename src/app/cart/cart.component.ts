import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CartService } from '../services/cart.service'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { PaymentComponent } from '../payment/payment.component'

@Component({
    selector: 'app-cart',
    imports: [CommonModule, FormsModule, PaymentComponent],
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.sass'],
    standalone: true
})
export class CartComponent implements OnInit {
  items: any[] = []
  total: number = 0

  // Datos de envío para el checkout
  shippingData = {
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: ''
  }

  // Variable para controlar el paso actual ('cart', 'checkout', 'payment', 'confirmation')
  currentStep: string = 'cart'

  @Output() close = new EventEmitter<void>()

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.loadCart()
  }

  loadCart(): void {
    this.items = this.cartService.getItems()
    this.calculateTotal()
  }

  calculateTotal(): void {
    this.total = this.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }

  removeItem(item: any): void {
    this.cartService.removeItem(item.id)
    this.loadCart()
  }

  updateQuantity(item: any, quantity: number): void {
    if (quantity < 1) return
    this.cartService.updateItemQuantity(item.id, quantity)
    this.loadCart()
  }

  // Método para cambiar el paso actual
  onStepChange(step: string): void {
    this.currentStep = step
  }

  // Método para continuar desde el carrito hacia el checkout
  continueCheckout(): void {
    this.onStepChange('checkout')
  }

  // Simula la confirmación del pago y cambia al paso de confirmación
  confirmPayment(): void {
    console.log('Pago confirmado')
    this.onStepChange('confirmation')
  }

  // Envía la orden con los datos de envío y el contenido del carrito
  submitOrder(): void {
    const order = {
      cabecera: {
        fullName: this.shippingData.fullName,
        address: this.shippingData.address,
        city: this.shippingData.city,
        postalCode: this.shippingData.postalCode,
        country: this.shippingData.country,
        phone: this.shippingData.phone,
        total: this.total
      },
      lineas: this.items.map((item, index) => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        position: index + 1
      }))
    }
    console.log('Orden enviada:', order)
    // Aquí se llamaría a un servicio para enviar la orden al backend.
    // Ejemplo: this.orderService.placeOrder(order).subscribe(...)
    this.onStepChange('confirmation')
  }

  // Método para cerrar el popup
  closeCart(): void {
    this.close.emit()
  }
}
