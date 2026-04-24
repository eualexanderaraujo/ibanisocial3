export function parseBRDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  
  const parts = dateStr.trim().split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '00:00:00';
  
  if (!datePart.includes('/')) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
  
  const [day, month, year] = datePart.split('/');
  const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
  const parsed = new Date(isoString);
  
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}
