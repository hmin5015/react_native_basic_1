import React from "react";

export type ThemeMode = "light" | "dark" | "auto";

type ThemeContextType = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  toggle: () => void;
};

export const ThemeContext = React.createContext<ThemeContextType | null>(null);

/* ---------- helpers ---------- */
function getTimeBasedTheme(): "light" | "dark" {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 19 ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ThemeMode>("auto");

  // 실제 적용되는 테마
  const resolved: "light" | "dark" =
    mode === "auto" ? getTimeBasedTheme() : mode;

  // auto → dark → light → auto
  const toggle = () => {
    setMode((prev) =>
      prev === "dark" ? "light" : "dark"
    );
  };

  React.useEffect(() => {
    if (mode !== "auto") return;

    const timer = setInterval(() => {
      setMode((m) => m); // 강제 리렌더 → 시간 재계산
    }, 60 * 1000); // 1분마다 체크

    return () => clearInterval(timer);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, resolved, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
