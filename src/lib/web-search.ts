// Web search constants - no localStorage, no auto-trigger
export const WEB_SEARCH_MAX_RESULTS = 3;

export function canUseWebSearch(): { allowed: boolean; reason?: string } {
  return { allowed: true };
}
