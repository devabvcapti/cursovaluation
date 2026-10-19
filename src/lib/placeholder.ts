/**
 * Marks a value as pending real-world content. Wrapping a draft fact in
 * `placeholder(...)` makes it render as `[LABEL]` so it is unmistakable
 * from real copy until someone supplies the actual value.
 */
export function placeholder(label: string): string {
  return `[${label}]`;
}

/**
 * Returns true when a string is a placeholder produced by `placeholder()`,
 * i.e. fully wrapped in a single pair of square brackets.
 */
export function isPlaceholder(value: string): boolean {
  return /^\[.+\]$/.test(value);
}
