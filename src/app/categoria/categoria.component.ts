import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FamilyService, Family, Article } from '../services/family.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.sass']
})
export class CategoriaComponent implements OnInit {
  // Array de IDs de secciones recibidas en la URL (por ejemplo: ["ren", "elc"])
  secIds: string[] = [];
  // Familias obtenidas del backend
  families: Family[] = [];
  errorMessage: string = '';

  // Paginación
  pageSize: number = 12;
  currentPage: number = 1;
  totalPages: number = 1;

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
      // Usar el endpoint para obtener familias por secciones
      this.familyService.getFamiliesBySections(secParam).subscribe({
        next: (families: Family[]) => {
          this.families = families;
          this.totalPages = Math.ceil(this.families.length / this.pageSize);
          console.log('Total páginas:', this.totalPages);
          console.log('Familias obtenidas:', this.families);
        },
        error: (err: any) => {
          console.error('Error al obtener familias:', err);
          this.errorMessage = 'Error al cargar las familias';
        }
      });
    } else {
      this.errorMessage = 'No se proporcionaron IDs de secciones';
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
