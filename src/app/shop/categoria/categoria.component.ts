import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FamilyService, Family }             from '../../services/family.service';
import { CommonModule }                       from '@angular/common';
import { DataService, Article }               from '../../services/data.service';
import { LoadingComponent }                   from '../../shared/loading/loading.component';

@Component({
  selector: 'app-categoria',
  imports: [CommonModule, RouterModule, LoadingComponent],
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.sass'],
  standalone: true
})
export class CategoriaComponent implements OnInit {
  families: Family[]         = [];
  filteredFamilies: Family[] = [];
  errorMessage: string       = '';
  
  pageSize = 20;
  displayedCount = 20;
  
  isLoading = true;
  isFilterOpen = true;
  availableTypes: string[] = [];
  selectedFilterTypes: string[] = [];

  // Seguimos guardando URLs (útil para debug)
  allImageUrls: string[] = [];

  // Índice de imágenes para matching
  private imageIndex: ImgIndex[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private familyService: FamilyService,
    private dataService:   DataService
  ) {}

  ngOnInit(): void {
    const secParam = this.route.snapshot.paramMap.get('sec');
    const families$ = secParam
      ? this.familyService.getFamiliesBySections(secParam)
      : this.familyService.getFamily();

    families$.subscribe({
      next: families => {
        this.families = families;
        this.initializeFilter();
        this.loadAllImageUrls();
      },
      error: _ => {
        this.errorMessage = 'Error al cargar las familias';
        this.isLoading = false;
      }
    });
  }

  /** ---------- HELPERS DE NORMALIZACIÓN / INDEXACIÓN ---------- */

  /** normaliza: minúsculas, sin tildes, solo [a-z0-9] y espacios */
  private normalize(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  /** slug: tokens unidos por '-' */
  private slugify(text: string): string {
    return this.normalize(text).replace(/\s+/g, '-');
  }

  /** tokens sin stopwords comunes (es) */
  private tokens(text: string): string[] {
    const stop = new Set(['de','del','la','el','los','las','y','para','con','por','en','a','un','una','unos','unas']);
    return this.normalize(text).split(/\s+/).filter(t => t && !stop.has(t));
  }

  /** slug de las N primeras palabras útiles (sin stopwords) */
  private firstNTokensSlug(text: string, n = 2): string {
    const tks = this.tokens(text).slice(0, n);
    return tks.length ? tks.join('-') : '';
  }

  /** convierte una ruta original (…/FOTOS/…) a /assets/img/factusolImg/FOTOS/... */
  private toLocalAsset(imgart?: string | null): string | null {
    if (!imgart) return null;
    let fixed = imgart.replace(/\\/g, '/');
    const m = fixed.match(/\/fotos\//i); // case-insensitive
    if (!m) return null;
    return 'assets/img/factusolImg' + fixed.substring(m.index!);
  }

  /** estructura indexada de cada imagen */
  private buildImageIndex(urls: string[]): ImgIndex[] {
    return urls.map(url => {
      const base = (url.split('/').pop() || '').replace(/\.[^.]+$/, ''); // sin extensión
      const slug = this.slugify(base);
      const toks = new Set(this.tokens(base));
      return { url, base, slug, tokens: toks };
    });
  }

  /** ---------- CARGA DE IMÁGENES + ÍNDICE ---------- */

  /** 1) Trae todos los artículos, normaliza imgart, crea índice y asigna */
  private loadAllImageUrls(): void {
    this.dataService.getArticles().subscribe({
      next: ({ articles }) => {
        const urls = articles
          .map(a => this.toLocalAsset(a.imgart))
          .filter((u): u is string => !!u);

        const unique = Array.from(new Set(urls));
        this.allImageUrls = unique;                 // útil para inspección
        this.imageIndex   = this.buildImageIndex(unique);

        this.assignImagesToFamilies();
        this.isLoading = false;
      },
      error: _ => { this.isLoading = false; }
    });
  }

  /** ---------- SCORING: PRIORIZA “empieza por las DOS primeras palabras” ---------- */

  private scoreImageForFamily(fam: Family, img: ImgIndex): number {
    const famSlugFull   = this.slugify(fam.desfam);          // ej: "acero-inoxidable-llaves"
    const famSlugFirst2 = this.firstNTokensSlug(fam.desfam); // ej: "acero-inoxidable"
    const famTokens     = new Set(this.tokens(fam.desfam));

    // 6: match exacto de slug
    if (img.slug === famSlugFull) return 6;

    // 5: imagen empieza por el slug completo
    if (img.slug.startsWith(famSlugFull)) return 5;

    // 4: imagen empieza por las DOS primeras palabras de la familia
    if (famSlugFirst2 && img.slug.startsWith(famSlugFirst2)) return 4;

    // 3: imagen contiene esas dos primeras palabras como bloque
    if (famSlugFirst2 && img.slug.includes(famSlugFirst2)) return 3;

    // 2: imagen contiene el slug completo como substring (no al inicio)
    if (img.slug.includes(famSlugFull)) return 2;

    // 1..2: solapamiento de tokens (cuantos más, mejor hasta 2)
    let overlap = 0;
    for (const t of famTokens) if (img.tokens.has(t)) overlap++;
    return Math.min(2, overlap);
  }

  /** 2) Asigna la mejor imagen para cada familia con fallback */
  private assignImagesToFamilies(): void {
    const placeholder = 'assets/img/placeholder.png';

    this.families.forEach(fam => {
      let bestUrl = placeholder;
      let bestScore = 0;

      for (const img of this.imageIndex) {
        const s = this.scoreImageForFamily(fam, img);
        if (s > bestScore) {
          bestScore = s;
          bestUrl = img.url;
          if (bestScore >= 5) break; // salida temprana si hay match muy fuerte
        }
      }

      (fam as any).imageUrl = bestUrl; // si Family no trae imageUrl, se añade a runtime
    });

    this.filteredFamilies = [...this.families];
  }

  /** ---------- RESTO TAL CUAL ---------- */

  private initializeFilter(): void {
    const types = this.families.map(f => f.desfam.trim().split(' ')[0]);
    this.availableTypes = Array.from(new Set(types));
    this.filteredFamilies = [...this.families];
    this.displayedCount = this.pageSize;
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  onCheckboxChange(evt: Event): void {
    const cb = evt.target as HTMLInputElement;
    const v = cb.value;
    if (cb.checked) {
      this.selectedFilterTypes.push(v);
    } else {
      this.selectedFilterTypes = this.selectedFilterTypes.filter(t => t !== v);
    }
    this.applyFilter();
  }

  private applyFilter(): void {
    if (!this.selectedFilterTypes.length) {
      this.filteredFamilies = [...this.families];
    } else {
      this.filteredFamilies = this.families.filter(f => {
        const first = f.desfam.trim().split(' ')[0];
        return this.selectedFilterTypes.includes(first);
      });
    }
    this.displayedCount = this.pageSize;
  }

  loadMore(): void {
    this.displayedCount += this.pageSize;
  }

  goToArticles(id: string): void {
    this.router.navigate(['/articulos', id]);
  }
  trackFam = (_: number, f: Family) => (f as any).codfam ?? f.desfam;
}

/** Tipo auxiliar para el índice de imágenes */
type ImgIndex = {
  url: string;
  base: string;
  slug: string;
  tokens: Set<string>;
};


