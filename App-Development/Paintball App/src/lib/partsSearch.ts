import type { DiagnosticResult, Marker } from '../types';

/** Plain text the user can paste into a supplier search or message to a tech. */
export function formatPartsShoppingList(marker: Marker, diagnosis: DiagnosticResult): string {
  const header = `${marker.brand} ${marker.name} — Pocket Tech parts list`;
  const lines = [header, '', `Symptom: ${diagnosis.symptom}`, ''];

  if (diagnosis.recommendedOrings.length === 0) {
    lines.push('(No specific O-rings returned — search for a rebuild kit or seal kit for this model.)');
    return lines.join('\n');
  }

  diagnosis.recommendedOrings.forEach((o, i) => {
    lines.push(`${i + 1}. Qty ${o.quantity} — ${o.name}`);
    lines.push(`   Size: ${o.size}`);
    lines.push(`   Location: ${o.location}`);
    lines.push('');
  });

  return lines.join('\n').trimEnd();
}

/**
 * Opens ANSgear with a search for the marker and parts.
 */
export function buildAnsgearPartsSearchUrl(marker: Marker, diagnosis: DiagnosticResult): string {
  const partTerms = diagnosis.recommendedOrings
    .map((o) => `${o.name} ${o.size}`.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const searchTerm = [
    marker.brand,
    marker.name,
    ...partTerms,
    partTerms.length ? '' : 'seal kit',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, '+')
    .trim();

  return `https://www.ansgear.com/search?q=${encodeURIComponent(searchTerm)}`;
}
