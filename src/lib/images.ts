export function optimizeImageUrl(
  url: string | null | undefined,
  options?: { width?: number; height?: number; quality?: number },
): string | undefined {
  if (!url) return undefined;
  if (!options) return url;

  const params = new URLSearchParams();
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.quality) params.set('quality', String(options.quality));
  if (options.width || options.height) params.set('resize', 'cover');

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}
