import React from "react";
import { View, Animated } from "react-native";
import { useThemeColors } from "./theme";

type UpdateInfo = {
  label: string;
  live: boolean;
};

export function HeroUpdateStatus({ update }: { update: UpdateInfo | null }) {
  const theme = useThemeColors();

  const pulse = React.useRef(new Animated.Value(1)).current;
  const fade = React.useRef(new Animated.Value(1)).current;

  /* ---------- Live dot pulse ---------- */
  React.useEffect(() => {
    if (!update?.live) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1.4,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [update?.live]);

  /* ---------- Text fade on update ---------- */
  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [update?.label]);

  if (!update) return null;

  return (
    <View
      style={{
        marginTop: 6,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      {update.live && (
        <Animated.View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            marginRight: 6,
            backgroundColor:
              theme.background === "#FFFFFF" ? "#05AC4F" : "#05AC4F",
            opacity: fade,
            transform: [{ scale: pulse }],
          }}
        />
      )}

      <Animated.Text
        style={{
          color: theme.subText,
          fontSize: 16,
          fontWeight: "600",
          opacity: fade,
        }}
      >
        {update.label}
      </Animated.Text>
    </View>
  );
}
