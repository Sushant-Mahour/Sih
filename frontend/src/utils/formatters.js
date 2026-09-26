export function formatDistance(km) {
  if (km === undefined || km === null || isNaN(km)) return '—';
  return `${Number(km).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatDuration(mins) {
  if (mins === undefined || mins === null || isNaN(mins) || mins === 0) return '—';
  const hrs = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (hrs === 0) return `${m} min`;
  return `${hrs}h ${m}m`;
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} IST`;
  } catch {
    return '—';
  }
}

export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '—';
  return Number(num).toLocaleString('en-IN');
}

export function formatWeight(kg) {
  if (kg === undefined || kg === null || isNaN(kg)) return '—';
  if (kg >= 1000) {
    return `${(kg / 1000).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MT`;
  }
  return `${Number(kg).toLocaleString('en-IN')} kg`;
}
