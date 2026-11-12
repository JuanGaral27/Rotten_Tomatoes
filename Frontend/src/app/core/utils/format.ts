/** Puntaje 0-10 -> "8.5" (o "—" si no hay). */
export const formatScore = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : Number.isInteger(value) ? `${value}.0` : String(value);

export const formatRuntime = (minutes: number | null): string => {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`;
};

export const formatDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '—';

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatVotes = (votes: number | null): string => (votes === null ? '' : votes.toLocaleString('es'));
