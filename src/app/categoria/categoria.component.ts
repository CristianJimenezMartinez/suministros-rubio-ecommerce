import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FamilyService, Family } from '../services/family.service';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loading/loading.component'; // Asegúrate de crear o importar tu componente de loading

@Component({
  selector: 'app-categoria',
  imports: [CommonModule, RouterModule, LoadingComponent],
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.sass'],
  standalone: true
})
export class CategoriaComponent implements OnInit {
  // Array de IDs de secciones recibidas en la URL
  secIds: string[] = [];
  // Familias obtenidas del backend
  families: Family[] = [];
  errorMessage: string = '';
  
  // Paginación
  pageSize: number = 12;
  currentPage: number = 1;
  totalPages: number = 1;
  
  // Indicador de carga
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private familyService: FamilyService
  ) {}

  ngOnInit(): void {
    const secParam = this.route.snapshot.paramMap.get('sec');
    if (secParam) {
      this.secIds = secParam.split(',').map(id => id.trim());
      console.log('IDs recibidas:', this.secIds);
      // Llama al servicio para obtener las familias por secciones
      this.familyService.getFamiliesBySections(secParam).subscribe({
        next: (families: Family[]) => {
          this.families = families;
          this.totalPages = Math.ceil(this.families.length / this.pageSize);
          console.log('Total páginas:', this.totalPages);
          console.log('Familias obtenidas:', this.families);
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error al obtener familias:', err);
          this.errorMessage = 'Error al cargar las familias';
          this.isLoading = false;
        }
      });
    } else {
      this.errorMessage = 'No se proporcionaron IDs de secciones';
      this.isLoading = false;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToArticles(familyId: string): void {
    // Navega a /articulos/:fam
    this.router.navigate(['/articulos', familyId]);
  }
}
