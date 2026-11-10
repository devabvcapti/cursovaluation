/**
 * Table names in the shared `abvcap-congress-2025` Supabase project, prefixed
 * so they never collide with that project's existing event/congress tables
 * (e.g. `coupon_categories`, a separate, unrelated event-coupon classification
 * table). See `@/lib/curso-slug` for how `pedidos`/`cupons` additionally scope
 * their rows to one specific course.
 */
export const TABLE_ASSOCIADOS = "curso_aprendacomquemfaz_associados";
/**
 * Email-based associado lookup (GlueUp member export), separate from the
 * CNPJ-based `TABLE_ASSOCIADOS` above — a DEV-only experiment (see
 * `lookupAssociadoPorEmail`) to catch members whose company CNPJ isn't on
 * file by matching the registrant's own email instead.
 */
export const TABLE_ASSOCIADOS_EMAIL = "curso_aprendacomquemfaz_associados_email";
export const TABLE_CUPONS = "curso_aprendacomquemfaz_cupons";
export const TABLE_PEDIDOS = "curso_aprendacomquemfaz_pedidos";
