/**
 * This Supabase project (abvcap-congress-2025) is shared across ABVCAP
 * products and, going forward, across different courses — the
 * `curso_aprendacomquemfaz_*` tables scope their course-specific rows
 * (pedidos, cupons) to one course via this slug, so a future course can
 * reuse the same tables without its orders/coupons mixing with this one's.
 * `associados` (the ABVCAP member CNPJ list) is intentionally NOT scoped by
 * this — membership is a company-wide fact, independent of which course is
 * currently open.
 */
export const CURSO_SLUG = "valuation";
