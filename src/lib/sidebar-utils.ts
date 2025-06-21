export const SIDEBAR_STORAGE_KEY = "sidebar-visible";

export function setSidebarStorage(isVisible: boolean) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isVisible));
    window.dispatchEvent(new CustomEvent("sidebar-visibility-changed"));
  } catch (error) {
    console.warn("Failed to save sidebar visibility to localStorage:", error);
  }
}

export function getSidebarFromStorage(): boolean | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored !== null ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Failed to load sidebar visibility from localStorage:", error);
    return null;
  }
}

export function getDefaultSidebarState(): boolean {
  if (typeof window === "undefined") return false;

  const isMobile = window.innerWidth < 1024;
  return !isMobile; // Desktop default: true, Mobile default: false
}
