import { Component, OnInit, inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { FamilyService, Family } from '../../services/family.service';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { RatesService } from '../../services/rates.service';
import { MOCK_ARTICLES, MOCK_FAMILIES } from './mock-articles';

export interface Article {
  codart: string;
  desart: string;
  dewart?: string;
  /**
   * Precio bruto (con IVA) como cadena, p.ej. "12.34"
   */
  pcoart: string;
  imgart: string;
  famart: string;
  eanart: string;
  measure?: string;
  /**
   * "0" ⇒ 21% IVA, "1" ⇒ 10% IVA
   */
  tivart?: string;

  /**
   * Precio neto (sin IVA), calculado en ArticulosComponent
   */
  netPrice?: string;

  /**
   * Importe de IVA, calculado en ArticulosComponent
   */
  vatAmount?: string;
}


@Component({
  selector: 'app-articulos',
  imports: [HttpClientModule, CommonModule, FormsModule],
  templateUrl: './articulos.component.html',
  styleUrls: ['./articulos.component.sass'],
  standalone: true
})
export class ArticulosComponent implements OnInit, OnDestroy {
  apiService = inject(DataService);
  familyService = inject(FamilyService);
  cartService = inject(CartService);
  ratesService = inject(RatesService);

  articles: Article[] = [];
  measures: string[] = [];
  errorMessage: string = '';

  // Agrupación original de artículos
  groupedArticles: { [key: string]: Article[] } = {};
  // Agrupación que se mostrará (después de filtrar)
  filteredGroupedArticles: { [key: string]: Article[] } = {};

  // Variante seleccionada por cada grupo
  selectedVariants: { [key: string]: Article } = {};

  // Familias y Categorías reales
  familyNamesMap: { [code: string]: string } = {};
  availableFamilies: { code: string; name: string; count: number }[] = [];
  selectedFamilies: string[] = [];

  // Rango de precio
  minPriceLimit: number = 0;
  maxPriceLimit: number = 1000;
  filterMinPrice: number = 0;
  filterMaxPrice: number = 1000;

  // Ordenación
  sortBy: string = 'default';

  // Paginación y control de scroll infinito
  pageSize: number = 12;
  displayedCount: number = 12;
  autoScrollCount: number = 0;
  readonly maxAutoScrolls: number = 3;

  // Indicadores de carga y modo búsqueda
  isLoading: boolean = false;
  isSearchMode: boolean = false;

  // Propiedades para el filtro integrado
  isFilterOpen: boolean = true;

  private observer!: IntersectionObserver;

  @ViewChild('infiniteScrollSentinel') set sentinel(element: ElementRef) {
    if (element) {
      if (this.observer) {
        this.observer.disconnect();
      }
      this.setupIntersectionObserver(element);
    }
  }

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // 1. Inicialización INMEDIATA con catálogo Mock de alta fidelidad para visualización instantánea
    MOCK_FAMILIES.forEach(f => {
      this.familyNamesMap[f.codfam] = f.desfam;
    });
    this.articles = [...MOCK_ARTICLES];
    this.groupArticlesAndSetup();
    this.isLoading = false;

    // 2. Consulta en segundo plano de familias del backend si está disponible
    this.familyService.getFamily().subscribe({
      next: (fams) => {
        if (fams && fams.length > 0) {
          fams.forEach(f => {
            this.familyNamesMap[f.codfam] = f.desfam;
          });
          if (this.articles.length > 0) {
            this.extractFamilies();
          }
        }
      },
      error: () => {}
    });

    // 3. Manejo de rutas y búsquedas
    this.route.queryParams.subscribe(params => {
      const query = params['query'];
      if (query) {
        this.isSearchMode = true;
        const q = query.toLowerCase();
        const matches = MOCK_ARTICLES.filter(a =>
          a.desart.toLowerCase().includes(q) ||
          a.codart.toLowerCase().includes(q) ||
          (a.measure && a.measure.toLowerCase().includes(q))
        );
        if (matches.length > 0) {
          this.articles = matches;
          this.groupArticlesAndSetup();
        }
        this.apiService.searchArticles(query).subscribe({
          next: (data: Article[]) => {
            if (data && data.length > 0) {
              this.processApiArticles(data);
            }
          },
          error: () => {
            this.isLoading = false;
          }
        });
      } else {
        const famParam = this.route.snapshot.paramMap.get('fam');
        if (famParam) {
          const famArticles = MOCK_ARTICLES.filter(a => a.famart === famParam);
          if (famArticles.length > 0) {
            this.articles = famArticles;
            this.groupArticlesAndSetup();
          }
          this.apiService.getArticlesByFamily(famParam).subscribe({
            next: (data: Article[]) => {
              if (data && data.length > 0) {
                this.processApiArticles(data);
              }
            },
            error: () => {
              this.isLoading = false;
            }
          });
        } else {
          this.apiService.getArticles().subscribe({
            next: (result) => {
              if (result && result.articles && result.articles.length > 0) {
                this.measures = (result.measures || [])
                  .map((m: any) => m.desume)
                  .filter((s: string) => s && s.trim() !== '');
                this.processApiArticles(result.articles);
              }
            },
            error: () => {
              this.isLoading = false;
            }
          });
        }
      }
    });
  }

  private processApiArticles(data: Article[]): void {
    data.forEach(article => {
      if (article.imgart) {
        let fixedPath = article.imgart.replace(/\\/g, '/');
        const index = fixedPath.indexOf('/FOTOS/');
        if (index !== -1) {
          const relativePath = fixedPath.substr(index);
          article.imgart = 'assets/img/factusolImg' + relativePath;
        }
      }
      if (article.dewart) {
        article.desart = article.dewart;
      }
      article.desart = article.desart
        .replace(/\\/g, '')
        .replace(/\n/g, ' ')
        .trim();
      const { truncatedName, foundMeasure } = extractMeasureFromDesart(article.desart, this.measures);
      article.desart = truncatedName;
      if (foundMeasure) {
        article.measure = foundMeasure;
      }
    });
    this.articles = data;
    this.ratesService.getInternetRate().subscribe({
      next: (internetRate) => {
        this.articles.forEach(article => {
          const basePrice = parseFloat(article.pcoart);
          const computedPrice = this.ratesService.calculateRealPrice(basePrice, internetRate);
          let vatPercentage = 21;
          switch (article.tivart) {
            case '0': vatPercentage = 21; break;
            case '1': vatPercentage = 10; break;
            case '2': vatPercentage = 4;  break;
            case '4': vatPercentage = 0;  break;
            default:  vatPercentage = 21;
          }
          const netPrice   = computedPrice;
          const vatAmount  = netPrice * (vatPercentage / 100);
          const grossPrice = netPrice + vatAmount;
          article.pcoart     = grossPrice.toFixed(2);
          article.netPrice   = netPrice.toFixed(2);
          article.vatAmount  = vatAmount.toFixed(2);
        });
        this.groupArticlesAndSetup();
      },
      error: () => {
        this.groupArticlesAndSetup();
      }
    });
  }

  // Método para agrupar artículos y configurar variantes, paginación y filtros reales
  private groupArticlesAndSetup(): void {
    this.groupedArticles = this.groupArticles(this.articles);
    for (const key in this.groupedArticles) {
      if (this.groupedArticles.hasOwnProperty(key)) {
        this.selectedVariants[key] = this.groupedArticles[key][0];
      }
    }

    // Calcular límites de precio
    let minP = 999999;
    let maxP = 0;
    this.articles.forEach(a => {
      const p = parseFloat(a.pcoart) || 0;
      if (p < minP) minP = p;
      if (p > maxP) maxP = p;
    });
    this.minPriceLimit = Math.floor(minP > 0 && minP < 999999 ? minP : 0);
    this.maxPriceLimit = Math.ceil(maxP > 0 ? maxP : 100);
    this.filterMinPrice = this.minPriceLimit;
    this.filterMaxPrice = this.maxPriceLimit;

    this.extractFamilies();
    this.applyAllFilters();
    this.isLoading = false;
  }

  private extractFamilies(): void {
    const famCounts: { [code: string]: number } = {};
    for (const key in this.groupedArticles) {
      if (this.groupedArticles.hasOwnProperty(key)) {
        const item = this.selectedVariants[key] || this.groupedArticles[key][0];
        const code = item?.famart || 'OTROS';
        famCounts[code] = (famCounts[code] || 0) + 1;
      }
    }

    this.availableFamilies = Object.keys(famCounts).map(code => ({
      code,
      name: this.familyNamesMap[code] || code,
      count: famCounts[code]
    })).sort((a, b) => b.count - a.count);
  }

  applyAllFilters(): void {
    const filtered: { [key: string]: Article[] } = {};

    for (const key in this.groupedArticles) {
      if (this.groupedArticles.hasOwnProperty(key)) {
        const item = this.selectedVariants[key] || this.groupedArticles[key][0];
        const price = parseFloat(item.pcoart) || 0;
        const famCode = item.famart || 'OTROS';

        // Filtro por familia
        const matchesFamily = this.selectedFamilies.length === 0 || this.selectedFamilies.includes(famCode);

        // Filtro por precio
        const matchesPrice = price >= this.filterMinPrice && price <= this.filterMaxPrice;

        if (matchesFamily && matchesPrice) {
          filtered[key] = this.groupedArticles[key];
        }
      }
    }

    // Ordenación
    const entries = Object.entries(filtered);
    if (this.sortBy === 'price-asc') {
      entries.sort((a, b) => {
        const pA = parseFloat(this.selectedVariants[a[0]]?.pcoart || '0');
        const pB = parseFloat(this.selectedVariants[b[0]]?.pcoart || '0');
        return pA - pB;
      });
    } else if (this.sortBy === 'price-desc') {
      entries.sort((a, b) => {
        const pA = parseFloat(this.selectedVariants[a[0]]?.pcoart || '0');
        const pB = parseFloat(this.selectedVariants[b[0]]?.pcoart || '0');
        return pB - pA;
      });
    } else if (this.sortBy === 'name-asc') {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (this.sortBy === 'name-desc') {
      entries.sort((a, b) => b[0].localeCompare(a[0]));
    }

    const sortedObj: { [key: string]: Article[] } = {};
    for (const [k, v] of entries) {
      sortedObj[k] = v;
    }

    this.filteredGroupedArticles = sortedObj;
    this.displayedCount = this.pageSize;
    this.autoScrollCount = 0;
  }

  onFamilyCheckboxChange(famCode: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedFamilies.includes(famCode)) {
        this.selectedFamilies.push(famCode);
      }
    } else {
      this.selectedFamilies = this.selectedFamilies.filter(c => c !== famCode);
    }
    this.applyAllFilters();
  }

  onPriceFilterChange(): void {
    this.applyAllFilters();
  }

  onSortChange(): void {
    this.applyAllFilters();
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters(): void {
    this.selectedFamilies = [];
    this.filterMinPrice = this.minPriceLimit;
    this.filterMaxPrice = this.maxPriceLimit;
    this.sortBy = 'default';
    this.applyAllFilters();
  }

  setQuickPrice(min: number, max: number): void {
    this.filterMinPrice = Math.max(min, this.minPriceLimit);
    this.filterMaxPrice = Math.min(max, this.maxPriceLimit);
    this.applyAllFilters();
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/img/agua.png';
    }
  }

  private setupIntersectionObserver(element: ElementRef): void {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.isLoading && this.autoScrollCount < this.maxAutoScrolls) {
        this.autoScrollCount++;
        this.loadMore();
      }
    }, {
      rootMargin: '200px'
    });
    this.observer.observe(element.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private groupArticles(articles: Article[]): { [key: string]: Article[] } {
    const groups: { [key: string]: Article[] } = {};
    articles.forEach(article => {
      const key = article.desart.trim();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(article);
    });
    return groups;
  }

  private extractArticleTypes(articles: Article[]): string[] {
    const types = articles.map(article => {
      const text = article.desart.trim();
      return text.split(' ')[0];
    });
    return Array.from(new Set(types));
  }

  loadMore(): void {
    this.displayedCount += this.pageSize;
  }

  nextPage(): void {
    // Se eliminan o dejan en desuso si se usa loadMore
  }

  previousPage(): void {
    // Se eliminan o dejan en desuso si se usa loadMore
  }

  onVariantChange(groupKey: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const idx = parseInt(target.value, 10);
    if (this.groupedArticles[groupKey] && idx >= 0 && idx < this.groupedArticles[groupKey].length) {
      this.selectedVariants[groupKey] = this.groupedArticles[groupKey][idx];
    }
  }

  addToCart(article: Article): void {
    const cartItem = {
      id:        article.codart,
      name:      article.dewart || article.desart,
      price:     parseFloat(article.pcoart),       // bruto (precio final con IVA)
      netPrice:  parseFloat(article.netPrice!),   // neto (precio sin IVA)
      vatAmount: parseFloat(article.vatAmount!),  // importe de IVA por unidad
      vatType:   parseInt(article.tivart || '0', 10), // 0,1,2,4 según tivart
      quantity:  1,
      img:       article.imgart
    };
    this.cartService.addItem(cartItem);
  }
}

function extractMeasureFromDesart(
  desart: string,
  measures: string[]
): { truncatedName: string, foundMeasure: string } {
  const sortedMeasures = [...measures].sort((a, b) => b.length - a.length);
  for (const measure of sortedMeasures) {
    const trimmedMeasure = measure.trim();
    if (trimmedMeasure && desart.includes(trimmedMeasure)) {
      const truncatedName = desart.replace(trimmedMeasure, '').trim();
      return { truncatedName, foundMeasure: trimmedMeasure };
    }
  }
  return { truncatedName: desart, foundMeasure: '' };
}
