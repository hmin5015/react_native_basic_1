/**
 * 순수 함수
 * - Hook ❌
 * - i18n ❌
 */
export function buildUpdateLabel(
  time?: string,
  labels?: {
    live: string;
    updated: string;
  }
) {
  if (!time || !labels) return null;

  const diff = Date.now() - new Date(time).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 2) {
    return {
      live: true,
      label: labels.live,
    };
  }

  return {
    live: false,
    label: `${labels.updated} ${minutes}m`,
  };
}
