// Converts a formatted time string like "10:45 AM" to short form "10:45a"
export function toShortTime(formatted: string | undefined | null): string {
  if (!formatted) return "";
  const parts = formatted.split(" ");
  if (parts.length !== 2) return formatted; // already condensed or unexpected
  let [t, ampm] = parts; // t => HH:MM
  const [h, m] = t.split(":");
  if (!h || !m || !ampm) return formatted;
  const hh = h.startsWith("0") ? h.slice(1) || "0" : h;
  return `${hh}:${m}${ampm[0].toLowerCase()}`;
}

export interface ShortTimeOptions {
  hideMinutesIfZero?: boolean;
}

// Optional variant that removes :00
export function toShortTimeCondensed(formatted: string | undefined | null, opts?: ShortTimeOptions): string {
  if (!formatted) return "";
  const base = toShortTime(formatted);
  if (!opts?.hideMinutesIfZero) return base;
  // base looks like h:mm[a|p]
  const timeRegex = /^(\d+):00([ap])$/i;
  const match = timeRegex.exec(base);
  if (match) return `${match[1]}${match[2]}`; // 3p
  return base;
}
