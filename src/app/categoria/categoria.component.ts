import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FamilyService, Family }             from '../services/family.service';
import { CommonModule }                       from '@angular/common';
import { DataService, Article }               from '../services/data.service';
import { LoadingComponent }                   from '../loading/loading.component';

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

  // Aquí guardamos las URLs normalizadas de imgart
  allImageUrls: string[] = []; 

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
      error: err => {
        console.error('Error al obtener familias:', err);
        this.errorMessage = 'Error al cargar las familias';
        this.isLoading = false;
      }
    });
  }

  /** 1) Trae todos los artículos, normaliza imgart y guarda URLs únicas */
  private loadAllImageUrls(): void {
    this.dataService.getArticles().subscribe({
      next: ({ articles }) => {
        const urls = articles
          .map(a => {
            let fixed = a.imgart.replace(/\\/g, '/');
            const idx = fixed.indexOf('/FOTOS/');
            if (idx !== -1) {
              fixed = 'assets/img/factusolImg' + fixed.substring(idx);
            }
            return fixed;
          });
        this.allImageUrls = Array.from(new Set(urls));
        this.assignImagesToFamilies();
        this.isLoading = false;
      },
      error: err => {
        console.error('Error al cargar artículos:', err);
        this.isLoading = false;
      }
    });
  }

  /** 2) Para cada familia, intenta buscar coincidencia por primera o segunda palabra */
  private assignImagesToFamilies(): void {
    const placeholder = 'assets/img/placeholder.png';

    this.families.forEach(fam => {
      // Obtiene primera y segunda palabra en minúsculas
      const parts = fam.desfam.trim().split(/\s+/);
      const keys = parts
        .slice(0, 2)
        .map(w => w.toLowerCase());

      // Busca URL cuyo nombre de fichero empiece por cualquiera de las keys
      const match = this.allImageUrls.find(url => {
        const filename = url.split('/').pop() || '';
        const namePart = filename.split('.')[0]
                                 .split(/[-_\s]+/)[0]
                                 .toLowerCase();
        return keys.includes(namePart);
      });

      fam.imageUrl = match || placeholder;
    });

    this.filteredFamilies = [...this.families];
  }

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
}
