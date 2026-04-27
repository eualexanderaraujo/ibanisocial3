export function parseBRDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  
  const s = String(dateStr).trim().replace(',', '');
  
  // 1. Check if already ISO or close to it (YYYY-MM-DD)
  if (s.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // 2. Handle DD/MM/YYYY format
  if (s.includes('/')) {
    const parts = s.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '00:00';
    
    const [d, m, y] = datePart.split('/');
    if (d && m && y) {
      // Month is 0-indexed in Date constructor
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      
      if (timePart) {
        const [hh, mm, ss] = timePart.split(':');
        date.setHours(parseInt(hh) || 0, parseInt(mm) || 0, parseInt(ss) || 0);
      }
      
      if (!isNaN(date.getTime())) return date;
    }
  }

  // 3. Fallback
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

