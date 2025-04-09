import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FamilyService, Family } from '../services/family.service';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-categoria',
  imports: [CommonModule, RouterModule, LoadingComponent],
  templateUrl: './categoria.component.html',
  styleUrls: ['./categoria.component.sass'],
  standalone: true
})
export class CategoriaComponent implements OnInit {
  secIds: string[] = [];
  families: Family[] = [];
  errorMessage: string = '';
  
  // Cantidad de familias a mostrar inicialmente y en cada "ver más"
  pageSize: number = 20;
  displayedCount: number = 20;
  
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
      this.familyService.getFamiliesBySections(secParam).subscribe({
        next: (families: Family[]) => {
          this.families = families;
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

  loadMore(): void {
    // Incrementa la cantidad de familias a mostrar
    this.displayedCount += this.pageSize;
  }

  goToArticles(familyId: string): void {
    this.router.navigate(['/articulos', familyId]);
  }
}
