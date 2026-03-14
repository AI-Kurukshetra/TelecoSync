export function netRevenue(grossRevenue: number, adjustments: number) {
  return Number((grossRevenue + adjustments).toFixed(4));
}
