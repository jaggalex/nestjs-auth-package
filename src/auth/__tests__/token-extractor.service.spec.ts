import { TokenExtractorService } from '../token-extractor.service';
import { Request } from 'express';

describe('TokenExtractorService', () => {
  const svc = new TokenExtractorService();

  const makeReq = (headers: any = {}, cookies: any = {}): Request =>
    ({ headers, cookies } as unknown as Request);

  it('extracts from Authorization header', () => {
    const req = makeReq({ authorization: 'Bearer abc' });
    expect(svc.extractToken(req)).toBe('abc');
  });

  it('extracts from cookie access_token', () => {
    const req = makeReq({}, { access_token: 'cookieTok' });
    expect(svc.extractToken(req)).toBe('cookieTok');
  });

  it('returns undefined when missing', () => {
    const req = makeReq();
    expect(svc.extractToken(req)).toBeUndefined();
  });
});