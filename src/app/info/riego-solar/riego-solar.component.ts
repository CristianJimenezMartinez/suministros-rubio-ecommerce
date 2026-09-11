import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-riego-solar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './riego-solar.component.html',
  styleUrls: ['./riego-solar.component.sass']
})
export class RiegoSolarComponent {}
