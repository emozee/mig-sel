export const BHUTAN_DZONGKHAGS = [
  'Bumthang',
  'Chhukha',
  'Dagana',
  'Gasa',
  'Haa',
  'Lhuentse',
  'Mongar',
  'Paro',
  'Pemagatshel',
  'Punakha',
  'Samdrup Jongkhar',
  'Samtse',
  'Sarpang',
  'Thimphu',
  'Trashigang',
  'Trashiyangtse',
  'Trongsa',
  'Tsirang',
  'Wangdue Phodrang',
  'Zhemgang',
] as const;

const locationAliases: Record<string, string> = {
  chukha: 'Chhukha',
  lhuntse: 'Lhuentse',
  'pema gatshel': 'Pemagatshel',
  'trashi yangtse': 'Trashiyangtse',
  'wangdi phodrang': 'Wangdue Phodrang',
};

export function normalizeBhutanLocation(value: string): string {
  const normalized = value
    .trim()
    .replace(/\s+(district|dzongkhag)$/i, '')
    .toLowerCase();
  const alias = locationAliases[normalized];
  if (alias) return alias;

  return (
    BHUTAN_DZONGKHAGS.find((location) => location.toLowerCase() === normalized) ?? value.trim()
  );
}
