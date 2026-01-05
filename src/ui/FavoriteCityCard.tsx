import React from "react";
import { View, Text, Pressable, Animated } from "react-native";
import LottieView from "lottie-react-native";

import { useOpenMeteo } from "../weather/api";
import { City } from "../shared/cityStore";
import { useThemeColors } from "./theme";
import { FavoriteCitySkeleton } from "./FavoriteCitySkeleton";
import { useUpdateLabel } from "../hooks/useUpdateLabel";
import { useI18n } from "../hooks/useI18n";

/* ---------- helpers ---------- */
function pickWeatherLottie(code?: number) {
  if (code == null) return require("../../assets/lottie/clear.json");
  if (code < 3) return require("../../assets/lottie/clear.json");
  if (code < 50) return require("../../assets/lottie/clouds.json");
  if (code < 70) return require("../../assets/lottie/rain.json");
  if (code < 90) return require("../../assets/lottie/snow.json");
  return require("../../assets/lottie/thunder.json");
}

/* ---------- Component ---------- */
export function FavoriteCityCard({
  city,
  onPress,
}: {
  city: City;
  onPress: () => void;
}) {
  const theme = useThemeColors();
  const { lang } = useI18n();
  const q = useOpenMeteo(city.lat, city.lon);

  // ✅ Hook은 항상 최상단
  const update = useUpdateLabel(q.data?.current_weather?.time);

  const scale = React.useRef(new Animated.Value(1)).current;

  if (q.isLoading || !q.data?.current_weather) {
    return <FavoriteCitySkeleton />;
  }

  const { temperature, weathercode } = q.data.current_weather;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
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
        <LottieView
          source={pickWeatherLottie(weathercode)}
          autoPlay
          loop
          speed={0.5}
          style={{ width: 52, height: 52, alignSelf: "center" }}
        />

        <Text
          style={{
            color: theme.text,
            fontSize: 26,
            fontWeight: "900",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {Math.round(temperature)}°
        </Text>

        {/* ✅ 여기 중요 */}
        <Text
          style={{
            color: theme.subText,
            fontSize: 14,
            fontWeight: "700",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {city.name[lang]}
        </Text>

        {update && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            {update.live && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    theme.background === "#FFFFFF" ? "#16a34a" : "#4ade80",
                  marginRight: 4,
                }}
              />
            )}
            <Text
              style={{
                color: theme.subText,
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {update.label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
