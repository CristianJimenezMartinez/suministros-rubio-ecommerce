import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CondicionesCompraComponent } from './condiciones-compra.component';

describe('CondicionesCompraComponent', () => {
  let component: CondicionesCompraComponent;
  let fixture: ComponentFixture<CondicionesCompraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CondicionesCompraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CondicionesCompraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
