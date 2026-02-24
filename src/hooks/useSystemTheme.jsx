import { useEffect, useState } from "react";

export function useSystemTheme() {
  const getTheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const [isDark, setIsDark] = useState(getTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = (e) => setIsDark(e.matches);

    // modern + fallback
    media.addEventListener?.("change", listener);
    media.addListener?.(listener);

    return () => {
      media.removeEventListener?.("change", listener);
      media.removeListener?.(listener);
    };
  }, []);

  return isDark;
}