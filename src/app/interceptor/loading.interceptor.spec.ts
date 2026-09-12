import { TestBed } from '@angular/core/testing';
import { LoadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';

describe('LoadingInterceptor', () => {
  let interceptor: LoadingInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoadingInterceptor, LoadingService]
    });
    interceptor = TestBed.inject(LoadingInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
