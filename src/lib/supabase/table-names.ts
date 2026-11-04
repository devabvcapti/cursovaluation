/**
 * Table names in the shared `abvcap-congress-2025` Supabase project, prefixed
 * so they never collide with that project's existing event/congress tables
 * (e.g. `coupon_categories`, a separate, unrelated event-coupon classification
 * table). See `@/lib/curso-slug` for how `pedidos`/`cupons` additionally scope
 * their rows to one specific course.
 */
export const TABLE_ASSOCIADOS = "curso_aprendacomquemfaz_associados";
export const TABLE_CUPONS = "curso_aprendacomquemfaz_cupons";
export const TABLE_PEDIDOS = "curso_aprendacomquemfaz_pedidos";
