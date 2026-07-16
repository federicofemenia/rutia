export function formatLastModified(date: Date): string {
  const time = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const isToday = date.toDateString() === new Date().toDateString();

  if (isToday) {
    return `Hoy ${time}`;
  }

  const day = date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  return `${day} ${time}`;
}
