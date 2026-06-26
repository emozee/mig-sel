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

export function optimizeStorageUrl(
  url: string,
  bucket: 'grievances' | 'diamonds' | 'avatars',
): string {
  const sizes: Record<string, { width: number; quality: number }> = {
    grievances: { width: 800, quality: 80 },
    diamonds: { width: 800, quality: 80 },
    avatars: { width: 128, quality: 80 },
  };
  const opts = sizes[bucket] ?? { width: 800, quality: 80 };
  return optimizeImageUrl(url, opts) ?? url;
}
