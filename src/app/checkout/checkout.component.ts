import { Component, OnInit } from '@angular/core'
import { CartService } from '../services/cart.service'
import { OrderService } from '../services/order.service'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'


@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
    imports: [CommonModule, FormsModule],
    styleUrls: ['./checkout.component.sass'],
    standalone: true
})
export class CheckoutComponent implements OnInit {
  shippingData = {
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    phone: ''
  }
  cartItems: any[] = []
  total: number = 0

  constructor(private cartService: CartService, private orderService: OrderService) {}

  ngOnInit(): void {
    // Recoge los artículos del carrito
    this.cartItems = this.cartService.getItems()
    this.total = this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }

  submitOrder(): void {
    // Construir la cabecera de la orden (datos de envío, etc.)
    const cabecera = {
      tippcl: 'V',  // Ejemplo: tipo de pedido (puedes ajustar según tu lógica)
      codpcl: null, // Se asignará en el back
      refpcl: 'REF-1234',  // Referencia, si es necesario
      fecpcl: new Date().toISOString(),
      agepcl: this.shippingData.fullName,
      clipcl: '',  // Podrías añadir ID del cliente si lo tienes
      dirpcl: this.shippingData.address,
      tivpcl: '',  // Tipo de IVA, etc.
      reqpcl: '',  // Requerimientos especiales
      almpcl: '',  // Almacén, si corresponde
      net1pcl: this.total
    }

    // Construir las líneas de pedido a partir del carrito
    const lineas = this.cartItems.map((item, index) => ({
      tiplpc: 'V', // Tipo de línea, ejemplo
      poslpc: index + 1,
      artlpc: item.id,
      deslpc: item.name,
      canlpc: item.quantity,
      dt1lpc: 0,  // Descuento si existe
      prelpc: item.price,
      totlpc: item.price * item.quantity
    }))

    const order = { cabecera, lineas }
    console.log('Enviando orden:', order)

    // Enviar la orden al backend
    this.orderService.placeOrder(order).subscribe(
      response => {
        console.log('Orden realizada correctamente:', response)
        // Aquí podrías limpiar el carrito o redirigir a una página de confirmación
      },
      error => {
        console.error('Error al realizar la orden:', error)
      }
    )
  }
}
