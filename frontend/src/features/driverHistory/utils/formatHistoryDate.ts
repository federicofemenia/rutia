function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Hoy" / "Ayer" / "DD/MM/AAAA" — `now` es inyectable para poder testear sin mockear el reloj. */
export function formatHistoryDate(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Hoy';
  }

  if (diffDays === 1) {
    return 'Ayer';
  }

  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
