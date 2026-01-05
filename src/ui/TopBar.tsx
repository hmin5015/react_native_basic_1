import React from "react";
import { View, Text, Pressable } from "react-native";
import { useThemeColors } from "../../src/ui/theme";
import { useI18n } from "../../src/hooks/useI18n";
import { useTheme } from "../../src/hooks/useTheme";

type Props = {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  solid?: boolean; // 스크롤 시 배경/라인 표시
};

export function TopBar({ title, left, right, solid = false }: Props) {
  const theme = useThemeColors();
  const { mode, toggle } = useTheme();

  // ✅ Hook은 반드시 컴포넌트 안에서
  const { lang, setLang, t } = useI18n();

  return (
    <View
      style={{
        height: 56,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: solid ? theme.background : "transparent",
        borderBottomWidth: solid ? 0.5 : 0,
        borderBottomColor: solid ? theme.border : "transparent",
      }}
    >
      {/* Left */}
      <View
        style={{
          width: 60,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        {left}
      </View>

      {/* Center */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {title ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: "#131313"// theme.text,
            }}
          >
            {title}
          </Text>
        ) : null}
      </View>

      {/* Right */}
      <View
        style={{          
          width: 60,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        {right}

        {/* Language toggle */}
        <Pressable
          onPress={() => setLang(lang === "ko" ? "en" : "ko")}
          hitSlop={8}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginRight: 5,
              color: theme.subText,
            }}
          >
            {lang === "ko" ? t("en") : t("ko")}
          </Text>
        </Pressable>

        <Pressable onPress={toggle} hitSlop={8}>
          <Text style={{ fontSize: 18, color: theme.subText }}>
            {mode === "dark" ? "☀️" : "🌙"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
