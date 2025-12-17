export function timeAgo(isoDate?: string | null) {
  if (!isoDate) return { key: "time.unknown", value: 0 };

  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return { key: "time.now", value: 0 };
  if (diffMinutes < 60) return { key: "time.minutes", value: diffMinutes };
  if (diffHours < 24) return { key: "time.hours", value: diffHours };
  if (diffDays === 1) return { key: "time.yesterday", value: 0 };

  return { key: "time.days", value: diffDays };
}
