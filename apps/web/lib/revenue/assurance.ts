export function calculateLeakagePercent(totalRated: number, totalBilled: number) {
  if (totalRated === 0) {
    return 0;
  }

  return Number((((totalRated - totalBilled) / totalRated) * 100).toFixed(4));
}
