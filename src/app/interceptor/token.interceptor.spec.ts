import { TestBed } from '@angular/core/testing';
import { TokenInterceptor } from './token.interceptor';

describe('TokenInterceptor', () => {
  let interceptor: TokenInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenInterceptor]
    });
    interceptor = TestBed.inject(TokenInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});
