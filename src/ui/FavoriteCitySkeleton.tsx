import React from "react";
import { View } from "react-native";
import { useThemeColors } from "./theme";

export function FavoriteCitySkeleton() {
  const theme = useThemeColors();
  const blockColor =
    theme.background === "#FFFFFF"
      ? "rgba(0,0,0,0.08)"
      : "rgba(255,255,255,0.12)";

  return (
    <View
      style={{
        backgroundColor:
          theme.background === "#FFFFFF"
            ? "rgba(0,0,0,0.03)"
            : "rgba(255,255,255,0.08)",
        borderRadius: 15,
        padding: 16,
        marginRight: 8,
        width: 130,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: blockColor,
          alignSelf: "center",
          marginBottom: 8,
        }}
      />
      <View
        style={{
          width: 46,
          height: 28,
          borderRadius: 6,
          backgroundColor: blockColor,
          alignSelf: "center",
          marginTop: 4,
        }}
      />
      <View
        style={{
          width: 70,
          height: 14,
          borderRadius: 6,
          backgroundColor: blockColor,
          alignSelf: "center",
          marginTop: 10,
        }}
      />
    </View>
  );
}
