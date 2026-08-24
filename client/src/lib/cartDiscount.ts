export function getTieredCartDiscountPercentage(unitCount: number) {
  if (unitCount >= 4) return 15;
  if (unitCount >= 3) return 10;
  if (unitCount >= 2) return 5;
  return 0;
}

export function getNextTieredCartDiscount(unitCount: number) {
  if (unitCount >= 4) return null;
  if (unitCount >= 3) return { need: 4 - unitCount, pct: 15 };
  if (unitCount >= 2) return { need: 3 - unitCount, pct: 10 };
  return { need: 2 - unitCount, pct: 5 };
}
