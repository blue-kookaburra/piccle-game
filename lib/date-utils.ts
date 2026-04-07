/** Formats an ISO date string "YYYY-MM-DD" to "DD Mon YYYY" (e.g. "07 Apr 2026"). */
export function formatDate(dateStr: string): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [year, month, day] = dateStr.split("-");
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
}
