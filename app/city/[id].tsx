import React from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";

import { loadCities, toggleFavorite, City } from "../../src/shared/cityStore";
import { useOpenMeteo } from "../../src/weather/api";
import { pickWeatherLottie } from "../../src/weather/weatherCode";
import { useThemeColors } from "../../src/ui/theme";
import { TopBar } from "../../src/ui/TopBar";

/* ---------- helpers ---------- */

function weatherCodeToText(code?: number) {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code ?? -1)) return "Partly cloudy";
  if (code && code >= 45 && code <= 48) return "Fog";
  if (code && code >= 51 && code <= 57) return "Drizzle";
  if (code && code >= 61 && code <= 67) return "Rain";
  if (code && code >= 71 && code <= 77) return "Snow";
  if (code && code >= 80 && code <= 82) return "Showers";
  if (code && code >= 95) return "Thunderstorm";
  return "Weather";
}

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric" });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short" });
}

/* ---------- Page ---------- */

export default function CityDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useThemeColors();

  const [city, setCity] = React.useState<City | null>(null);
  const [solid, setSolid] = React.useState(false);

  React.useEffect(() => {
    loadCities().then((list) => {
      const found = list.find((c) => c.id === id);
      if (found) setCity(found);
    });
  }, [id]);

  const q = useOpenMeteo(city?.lat ?? 0, city?.lon ?? 0);

  const onToggleFav = React.useCallback(async () => {
    if (!id) return;
    const result = await toggleFavorite(String(id));
    const updated = result.cities.find((c) => c.id === id) ?? null;
    setCity(updated);

    Alert.alert(
      result.favorite ? "즐겨찾기에 추가했어요" : "즐겨찾기에서 제거했어요",
      updated?.name ?? ""
    );
  }, [id]);

  if (!city || q.isLoading || !q.data?.current_weather || !q.data.hourly || !q.data.daily) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar style={theme.background === "#FFFFFF" ? "dark" : "light"} />
        <TopBar
          left={
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>←</Text>
            </Pressable>
          }
        />
        <Text style={{ color: theme.text, textAlign: "center", marginTop: 40 }}>
          Loading…
        </Text>
      </SafeAreaView>
    );
  }

  const { current_weather, hourly, daily } = q.data;

  const now = Date.now();
  let startIndex = hourly.time.findIndex((t: string) => new Date(t).getTime() >= now);
  if (startIndex < 0) startIndex = 0;

  const currentTemp = Math.round(current_weather.temperature);
  const feelsLike =
    hourly.apparent_temperature?.[startIndex] !== undefined
      ? Math.round(hourly.apparent_temperature[startIndex])
      : currentTemp;

  const len24 = Math.min(
    24,
    hourly.time.length - startIndex,
    hourly.temperature_2m.length - startIndex,
    hourly.weathercode.length - startIndex
  );

  const next24 = Array.from({ length: len24 }, (_, i) => {
    const idx = startIndex + i;
    return {
      time: hourly.time[idx],
      temp: hourly.temperature_2m[idx],
      code: hourly.weathercode[idx],
    };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.background === "#FFFFFF" ? "dark" : "light"} />

      <TopBar
        title={city.name}
        solid={solid}
        left={
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>←</Text>
          </Pressable>
        }
        right={
          <Pressable onPress={onToggleFav}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>
              {city.favorite ? "★" : "☆"}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
        onScroll={(e) => setSolid(e.nativeEvent.contentOffset.y > 20)}
        scrollEventThrottle={16}
      >
        {/* Current */}
        <View style={{ alignItems: "center", marginBottom: 35 }}>
          <LottieView
            source={pickWeatherLottie(current_weather.weathercode)}
            autoPlay
            loop
            speed={0.6}
            style={{ width: 125, height: 125 }}
          />

          <Text style={{ color: theme.text, fontSize: 64, fontWeight: "900" }}>
            {currentTemp}°
          </Text>

          <Text style={{ color: theme.subText }}>
            Feels like {feelsLike}° · {weatherCodeToText(current_weather.weathercode)}
          </Text>
        </View>

        {/* Next 24 Hours */}
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
          Next 24 Hours
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {next24.map((h) => (
            <View
              key={h.time}
              style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                padding: 12,
                alignItems: "center",
                marginRight: 6,
                width: 88,
              }}
            >
              <Text style={{ color: theme.subText, fontSize: 12, paddingBottom: 5 }}>{formatHour(h.time)}</Text>

              <LottieView
                source={pickWeatherLottie(h.code)}
                autoPlay
                loop
                speed={0.6}
                style={{ width: 36, height: 36 }}
              />

              <Text style={{ color: theme.text, fontWeight: "600", paddingTop: 5 }}>
                {Math.round(h.temp)}°
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* 7-Day Forecast */}
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginBottom: 12 }}>
          7-Day Forecast
        </Text>

        {daily.time.slice(0, 7).map((d: string, i: number) => (
          <View
            key={d}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 8,
              borderBottomWidth: 0.5,
              borderColor: theme.border,
            }}
          >
            <Text style={{ color: theme.text, width: 50 }}>{formatDay(d)}</Text>

            <LottieView
              source={pickWeatherLottie(daily.weathercode[i])}
              autoPlay
              loop
              speed={0.6}
              style={{ width: 36, height: 36 }}
            />

            <Text style={{ color: theme.text, opacity: 0.85 }}>
              {Math.round(daily.temperature_2m_min[i])}° /{" "}
              {Math.round(daily.temperature_2m_max[i])}°
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
