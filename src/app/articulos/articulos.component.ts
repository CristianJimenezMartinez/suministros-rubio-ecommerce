import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DataService } from '../services/data.service'
import { HttpClientModule } from '@angular/common/http'
import { ActivatedRoute } from '@angular/router'
import { CartService } from '../services/cart.service'

export interface Article {
  codart: string
  desart: string   // Se usará internamente (ya limpia de la medida)
  dewart?: string  // Esta es la descripción que se mostrará
  pcoart: string
  imgart: string
  famart: string
  eanart: string
  measure?: string // Medida extraída (la variante que diferencia el artículo)
}

@Component({
  selector: 'app-articulos',
  standalone: true,
  imports: [HttpClientModule, CommonModule],
  templateUrl: './articulos.component.html',
  styleUrls: ['./articulos.component.sass']
})
export class ArticulosComponent implements OnInit {
  apiService = inject(DataService)
  cartService = inject(CartService)
  articles: Article[] = []
  measures: string[] = []
  errorMessage: string = ''

  // Artículos agrupados por nombre (dewart)
  groupedArticles: { [key: string]: Article[] } = {}
  // Para cada grupo se guarda la variante seleccionada
  selectedVariants: { [key: string]: Article } = {}

  // Paginación (si se necesita para otras vistas)
  pageSize: number = 12
  currentPage: number = 1
  totalPages: number = 1

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const famParam = this.route.snapshot.paramMap.get('fam')
    if (!famParam) {
      this.errorMessage = 'No se proporcionó la familia'
      return
    }

    // Llamada 1: Obtener las medidas (campo "desume")
    this.apiService.getMeasures().subscribe({
      next: (res) => {
        this.measures = (res.measures || [])
          .map((m: any) => m.desume)
          .filter((s: string) => s && s.trim() !== '')
        console.log('Medidas obtenidas:', this.measures)

        // Llamada 2: Obtener los artículos de la familia
        this.apiService.getArticlesByFamily(famParam).subscribe({
          next: (data: Article[]) => {
            console.log('Artículos recibidos del back:', data)
            data.forEach(article => {
              if (article.imgart) {
                article.imgart = article.imgart.replace(/\\/g, '/')
              }
              if (article.dewart) {
                article.desart = article.dewart
              }
              article.desart = article.desart.replace(/\\/g, '').replace(/\n/g, ' ').trim()
              const { truncatedName, foundMeasure } = extractMeasureFromDesart(article.desart, this.measures)
              article.desart = truncatedName
              if (foundMeasure) {
                article.measure = foundMeasure
              }
              console.log(`Artículo ${article.codart}: medida: ${article.measure}`)
            })
            this.articles = data
            this.groupedArticles = this.groupArticles(this.articles)
            for (const key in this.groupedArticles) {
              if (this.groupedArticles.hasOwnProperty(key)) {
                this.selectedVariants[key] = this.groupedArticles[key][0]
              }
            }
            console.log('Artículos agrupados:', this.groupedArticles)
            this.totalPages = Math.ceil(this.articles.length / this.pageSize)
            console.log('Artículos procesados:', this.articles)
          },
          error: (err) => {
            console.error('Error al obtener artículos:', err)
            this.errorMessage = 'Error al cargar los artículos'
          }
        })
      },
      error: (err) => {
        console.error('Error al obtener medidas:', err)
        this.errorMessage = 'Error al cargar las medidas'
      }
    })
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
    }
  }

  // Actualiza la variante seleccionada para un grupo a partir del índice seleccionado
  onVariantChange(groupKey: string, event: Event): void {
    const target = event.target as HTMLSelectElement
    const idx = parseInt(target.value, 10)
    if (this.groupedArticles[groupKey] && idx >= 0 && idx < this.groupedArticles[groupKey].length) {
      this.selectedVariants[groupKey] = this.groupedArticles[groupKey][idx]
    }
  }

  // Método para agregar la variante seleccionada al carrito
  addToCart(article: Article): void {
    // Transformamos el objeto para tener las propiedades necesarias en el carrito
    const cartItem = {
      id: article.codart, // Utilizamos el código de artículo como id
      name: article.dewart || article.desart, // El nombre a mostrar (puedes ajustar según tu lógica)
      price: parseFloat(article.pcoart), // Asegúrate de convertir a número si es string
      quantity: 1, // Se inicia con 1, o puedes usar otra lógica si ya existe una cantidad
      img: article.imgart
    };
    this.cartService.addItem(cartItem);
    console.log(`Artículo ${article.codart} añadido al carrito`);
  }
  

  // Agrupa los artículos por el valor de "dewart" (o "desart" como fallback)
  private groupArticles(articles: Article[]): { [key: string]: Article[] } {
    const groups: { [key: string]: Article[] } = {}
    articles.forEach(article => {
      const key = article.dewart ? article.dewart.trim() : article.desart
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(article)
    })
    return groups
  }
}

// Función para extraer la medida (completa) de "desart" usando la lista de medidas del back.
// Se ordena el array de medidas de mayor a menor longitud para capturar primero la coincidencia más completa.
function extractMeasureFromDesart(
  desart: string,
  measures: string[]
): { truncatedName: string, foundMeasure: string } {
  const sortedMeasures = [...measures].sort((a, b) => b.length - a.length)
  for (const measure of sortedMeasures) {
    const trimmedMeasure = measure.trim()
    if (trimmedMeasure && desart.includes(trimmedMeasure)) {
      const truncatedName = desart.replace(trimmedMeasure, '').trim()
      return { truncatedName, foundMeasure: trimmedMeasure }
    }
  }
  return { truncatedName: desart, foundMeasure: '' }
}
