export const THEME_COOKIE_NAME = "theme";

export function setThemeCookie(theme: string, days: number = 365) {
  if (typeof document === "undefined") return;

  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getThemeFromCookie(cookieString?: string): string | null {
  if (!cookieString) return null;

  const value = `; ${cookieString}`;
  const parts = value.split(`; ${THEME_COOKIE_NAME}=`);

  if (parts.length === 2) {
    const theme = parts.pop()?.split(";").shift();
    return theme === "dark" || theme === "light" ? theme : null;
  }

  return null;
}
