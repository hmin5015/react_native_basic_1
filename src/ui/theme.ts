import { useTheme } from "../hooks/useTheme";

export function useThemeColors() {
  const { resolved } = useTheme();

  if (resolved === "dark") {
    return {
      background: "#131313",
      text: "#FFFFFF",
      subText: "rgba(255,255,255,0.9)",
      border: "rgba(255,255,255,0.15)",
      card: "rgba(255,255,255,0.08)",
    };
  }

  return {
    background: "#FFFFFF",
    text: "#000000",
    subText: "rgba(0,0,0,0.9)",
    border: "rgba(0,0,0,0.12)",
    card: "rgba(0,0,0,0.05)",
  };
}
