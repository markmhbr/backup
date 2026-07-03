/**
 * Format tanggal dari ISO/database format ke format Indonesia DD-MM-YYYY.
 * Contoh: "2026-01-15T00:00:00.000Z" => "15-01-2026"
 * Contoh: "2026-01-15" => "15-01-2026"
 */
export const formatDateDMY = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return cleanDate;
};

/**
 * Format tanggal dari ISO/database format ke format Indonesia DD-MM-YYYY.
 * Returns empty string instead of "-" when no date.
 */
export const formatDateDMYEmpty = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return cleanDate;
};

/**
 * Format Date object to DD-MM-YYYY string.
 */
export const formatDateObjDMY = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) return "-";
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

/**
 * Format Date object to DD-MM-YYYY HH:mm string (with time).
 */
export const formatDateTimeDMY = (date: Date | null | undefined): string => {
  if (!date || isNaN(date.getTime())) return "-";
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${d}-${m}-${y} ${hh}:${mm}`;
};
