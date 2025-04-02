import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Interfaz para un artículo. Ajusta o importa la interfaz que usas en tu proyecto.
export interface Article {
  codart: string;
  desart: string;
  pcoart: string;
  imgart: string;
  famart: string;
  eanart: string;
  measure?: string;
}

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.sass']
})
export class ArticleDetailComponent {
  @Input() article!: Article;
}
