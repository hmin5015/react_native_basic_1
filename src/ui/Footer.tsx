import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "./theme";
import { useI18n } from "../hooks/useI18n";

const FOOTER_HEIGHT = 64; // 고정 높이

export function Footer() {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom,
        paddingTop: 15,
        backgroundColor: "#F5F6F7",//theme.background,
        borderTopWidth: 0.5,
        borderColor: theme.border,
        alignItems: "center",
      }}
    >
      {/* Info */}
      <Text
        style={{
          color: theme.subText,
          fontSize: 14,
          marginTop: 6,
          textAlign: "center",
        }}
      >
        {t("footer_app_info")}
      </Text>

      {/* Disclaimer */}
      <Text
        style={{
          color: theme.subText,
          fontSize: 12,
          marginTop: 6,
          textAlign: "center",
          lineHeight: 16,
          paddingHorizontal: 24,
        }}
      >
        {t("footer_bottom_info")}
      </Text>
    </View>
  );
}

export const FIXED_FOOTER_HEIGHT = FOOTER_HEIGHT;
