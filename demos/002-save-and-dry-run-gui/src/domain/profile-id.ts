// Profile id is `profile-<slug-of-name>` at creation; immutable thereafter
// (profile-schema.md). Slug: lowercase, alphanumerics + hyphens, collapsed.

export function profileIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `profile-${slug || 'unnamed'}`;
}
