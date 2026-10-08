import { describe, it, expect } from 'vitest';
import { isNotifiableUserId } from '../../../convex/notificationUtils';

describe('isNotifiableUserId — garde anti-invité', () => {
  it('rejette les demandes non authentifiées', () => {
    expect(isNotifiableUserId('anonymous')).toBe(false);
  });

  it('rejette les valeurs vides ou absentes', () => {
    expect(isNotifiableUserId('')).toBe(false);
    expect(isNotifiableUserId(null)).toBe(false);
    expect(isNotifiableUserId(undefined)).toBe(false);
  });

  it('rejette les identifiants invités Xpress (paiement sans compte)', () => {
    expect(isNotifiableUserId('guest:client@example.com')).toBe(false);
    expect(isNotifiableUserId('guest:')).toBe(false);
  });

  it('accepte un tokenIdentifier Clerk', () => {
    expect(isNotifiableUserId('https://clerk.suji.ng|user_2abcDEF123')).toBe(true);
  });

  it('accepte un _id legacy de doc users (réparé à la connexion par la réconciliation)', () => {
    expect(isNotifiableUserId('k57d8bq7j8x9y2z1w3v4u5t6r7s')).toBe(true);
  });
});
