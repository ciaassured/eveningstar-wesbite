export const siteBase = import.meta.env.BASE_URL;

export function assetPath(path: string) {
  return `${siteBase}${path}`;
}
