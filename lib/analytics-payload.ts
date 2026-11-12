const reserved = /^(firebase_|google_|ga_)/;
const automaticEvents = new Set(["first_open", "first_visit", "session_start", "user_engagement", "error", "app_remove", "app_update", "notification_open"]);

export function validEventName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name) && !reserved.test(name) && !automaticEvents.has(name);
}

export function analyticsPayload(props: Record<string, unknown>): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(props)) {
    if (Object.keys(result).length === 25) break;
    if (!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(key) || reserved.test(key)) continue;
    if (typeof value === "boolean") result[key] = Number(value);
    else if (typeof value === "number" && Number.isFinite(value)) result[key] = value;
    else if (typeof value === "string") result[key] = Array.from(value).slice(0, 100).join("");
  }
  return result;
}
