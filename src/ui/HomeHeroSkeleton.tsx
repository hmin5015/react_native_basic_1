import React from "react";
import { View } from "react-native";
import { useThemeColors } from "./theme";

export function HomeHeroSkeleton({ height }: { height: number }) {
  const theme = useThemeColors();
  const blockColor =
    theme.background === "#FFFFFF"
      ? "rgba(0,0,0,0.08)"
      : "rgba(255,255,255,0.12)";

  return (
    <View
      style={{
        height,
        padding: 24,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 140,
          height: 18,
          borderRadius: 6,
          backgroundColor: blockColor,
          marginBottom: 24,
        }}
      />
      <View
        style={{
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: blockColor,
          alignSelf: "center",
          marginBottom: 16,
        }}
      />
      <View
        style={{
          width: 120,
          height: 48,
          borderRadius: 8,
          backgroundColor: blockColor,
          alignSelf: "center",
        }}
      />
    </View>
  );
}
