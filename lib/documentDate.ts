const DEFAULT_DOCUMENT_DATE = '18 Desember 2025 / 27 Jumadil Akhir 1447 H';

export function getDocumentDate(settings?: { documentDate?: string | null } | null): string {
  const fromSettings = settings?.documentDate?.trim();
  if (fromSettings) return fromSettings;

  const fromEnv = process.env.NEXT_PUBLIC_DOCUMENT_DATE?.trim();
  if (fromEnv) return fromEnv;

  return DEFAULT_DOCUMENT_DATE;
}
