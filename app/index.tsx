import React from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";

import { loadCities, City } from "../src/shared/cityStore";
import { useOpenMeteo } from "../src/weather/api";
import { useThemeColors } from "../src/ui/theme";
import { TopBar } from "../src/ui/TopBar";
import { Footer } from "../src/ui/Footer";
import { FavoriteCityCard } from "../src/ui/FavoriteCityCard";
import { HomeHeroSkeleton } from "../src/ui/HomeHeroSkeleton";
import { HeroUpdateStatus } from "../src/ui/HeroUpdateStatus";
import { useI18n } from "../src/hooks/useI18n";
import { useUpdateLabel } from "../src/hooks/useUpdateLabel";
import { AnimatedCircularGauge } from "@/src/ui/AnimatedCircularGauge";
import { WeeklyTemperatureChart } from "@/src/ui/WeeklyTemperatureChart";
import { WeeklyPrecipitationChart } from "@/src/ui/WeeklyPrecipitationChart";
import { WeeklyWeatherComboChart } from "@/src/ui/WeeklyWeatherComboChart";
import { WeeklyWeatherComboChartInteractive } from "@/src/ui/WeeklyWeatherComboChartInteractive";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useAirQuality } from "@/src/hooks/useAirQuality";
import { pm25Level, pm10Level, levelColor, pmMarkerColor } from "@/src/weather/airLevel";

const { height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.27;

/* ---------- helpers ---------- */
function pickWeatherLottie(code?: number) {
  if (code == null) return require("../assets/lottie/clear.json");
  if (code < 3) return require("../assets/lottie/clear.json");
  if (code < 50) return require("../assets/lottie/clouds.json");
  if (code < 70) return require("../assets/lottie/rain.json");
  if (code < 90) return require("../assets/lottie/snow.json");
  return require("../assets/lottie/thunder.json");
}

/* ---------- health index helpers ---------- */

// 0~100 점수로 변환 (게이지용)
function levelToScore(level: string) {
  switch (level) {
    case "낮음":
      return 20;
    case "보통":
      return 50;
    case "주의":
      return 70;
    case "경고":
      return 90;
    default:
      return 0;
  }
}

/* 자외선지수 */
function uvLevel(uv?: number) {
  if (uv == null) return "낮음";
  if (uv < 3) return "낮음";
  if (uv < 6) return "보통";
  if (uv < 8) return "주의";
  return "경고";
}

/* 대기정체지수 (풍속 기반) */
function stagnationLevel(wind?: number) {
  if (wind == null) return "보통";
  if (wind < 2) return "경고";
  if (wind < 4) return "주의";
  return "낮음";
}

/* 감기지수 (기온 + 습도) */
function coldLevel(temp?: number, humidity?: number) {
  if (temp == null || humidity == null) return "보통";
  if (temp < 5 && humidity < 40) return "경고";
  if (temp < 10) return "주의";
  return "낮음";
}

/* 심뇌혈관질환지수 (일교차/한파) */
function cardioLevel(min?: number, max?: number) {
  if (min == null || max == null) return "관심";
  const diff = max - min;
  if (min < -5 || diff >= 10) return "경고";
  if (diff >= 7) return "주의";
  return "관심";
}

/* ---------- FREE reverse geocoding (BigDataCloud) ---------- */
async function reverseGeocodeFree(
  lat: number,
  lon: number,
  lang: "ko" | "en"
) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&localityLanguage=${lang}`
    );

    if (!res.ok) return null;
    const json = await res.json();

    const city =
      json.city ||
      json.locality ||
      json.principalSubdivision;

    const country = json.countryName;

    if (!city && !country) return null;
    return country ? `${city ?? ""}${city ? ", " : ""}${country}` : city;
  } catch {
    return null;
  }
}

export default function Home() {
  const router = useRouter();
  const theme = useThemeColors();
  const { lang, t } = useI18n();

  const [coords, setCoords] = React.useState<{ lat: number; lon: number } | null>(null);
  const [cityLabel, setCityLabel] = React.useState("");
  const [favorites, setFavorites] = React.useState<City[]>([]);

  /* favorites */
  React.useEffect(() => {
    loadCities().then(list => setFavorites(list.filter(c => c.favorite)));
  }, []);

  /* location */
  React.useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCityLabel(t("your_area")); // UI 문구만 i18n
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    })();
  }, [t]);

  /* reverse geocode (FREE) */
  React.useEffect(() => {
    if (!coords) return;
    let cancelled = false;

    (async () => {
      const label = await reverseGeocodeFree(
        coords.lat,
        coords.lon,
        lang
      );
      if (!cancelled && label) setCityLabel(label);
    })();

    return () => {
      cancelled = true;
    };
  }, [coords, lang]);

  /* weather */
  const q = useOpenMeteo(coords?.lat ?? 0, coords?.lon ?? 0);
  const current = q.data?.current_weather;
  const update = useUpdateLabel(current?.time);
  const hourly = q.data?.hourly;

  const chartW = Dimensions.get("window").width - 32;
  const daily = q.data?.daily;
  const weeklyRain = daily?.precipitation_sum?.slice(0, 7) ?? [];
  const hasRain = weeklyRain.some((v:any) => (v ?? 0) > 0);

  // 현재 시각 index (hourly 배열용)
  const nowIndex = hourly?.time?.findIndex((t:any) => t === current?.time) ?? 0;

  // 실제 지수 레벨 계산
  const uvLv = uvLevel(daily?.uv_index_max?.[0]);
  const stagnationLv = stagnationLevel(current?.windspeed);
  const coldLv = coldLevel(
    current?.temperature,
    hourly?.relativehumidity_2m?.[nowIndex]
  );
  const cardioLv = cardioLevel(
    daily?.temperature_2m_min?.[0],
    daily?.temperature_2m_max?.[0]
  );

  // 게이지 점수 (0~100)
  const uvScore = levelToScore(uvLv);
  const stagnationScore = levelToScore(stagnationLv);
  const coldScore = levelToScore(coldLv);
  const cardioScore = levelToScore(cardioLv);

  const heroReady = !!coords && !!current;

  const days7 = daily?.time?.slice(0, 7) ?? [];
  const max7 = daily?.temperature_2m_max?.slice(0, 7) ?? [];
  const min7 = daily?.temperature_2m_min?.slice(0, 7) ?? [];
  const rain7 = daily?.precipitation_sum?.slice(0, 7) ?? [];

  const canDrawWeekly =
    days7.length === 7 && max7.length === 7 && min7.length === 7 && rain7.length === 7;

  // favorites 좌표 필드 호환 (lat/lon or latitude/longitude)
  const favoriteMarkers = (favorites ?? [])
    .map((c: any) => {
      const lat = c.lat ?? c.latitude;
      const lon = c.lon ?? c.longitude;
      if (typeof lat !== "number" || typeof lon !== "number") return null;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return { id: c.id, name: c.name, lat, lon };
    })
    .filter(Boolean) as { id: string; name: string; lat: number; lon: number }[];

  const [selectedDayIndex, setSelectedDayIndex] = React.useState<number | null>(null);

  const { data: air } = useAirQuality(coords?.lat, coords?.lon);
  const pm25 = air?.pm2_5;
  const pm25Lv = pm25Level(pm25);
  const pm10 = air?.pm10;
  const pm10Lv = pm10Level(pm10);

  const [pmType, setPmType] = React.useState<"PM25" | "PM10">("PM25");
  const pmValue = pmType === "PM25" ? air?.pm2_5 : air?.pm10;
  const pmLabel = pmType === "PM25" ? "PM2.5" : "PM10";
  const pmColor = pmMarkerColor(pmValue);

  const PM_TABS = [
    { key: "PM25" as const, label: "PM2.5" },
    { key: "PM10" as const, label: "PM10" },
  ];

  const [markerTracking, setMarkerTracking] = React.useState(true);

  React.useEffect(() => {
    setMarkerTracking(true);
    const id = setTimeout(() => setMarkerTracking(false), 900);
    return () => clearTimeout(id);
  }, [pmType, pmValue, coords?.lat, coords?.lon]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <StatusBar style={theme.background === "#FFFFFF" ? "dark" : "light"} />

      <TopBar
        title={t("weather")}
        right={
          <Pressable onPress={() => router.push("/cities")}>
            <Text style={{ color: theme.subText, fontSize: 18 }}>
              {t("cities")}
            </Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        {!heroReady ? (
          <HomeHeroSkeleton height={HERO_HEIGHT} />
        ) : (
          <View style={{ height: HERO_HEIGHT, padding: 24 }}>

            {/* Favorite & City Label*/}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>

              {/* Favorite Star*/}
              <Text style={{ 
                color: "#D5D5D5", 
                paddingRight: 5,
                fontSize: 18,
              }}>
                ★
              </Text>

              {/* 도시명: BigDataCloud 결과 */}
              <Text style={{ 
                color: theme.subText, 
                fontSize: 18, 
                textAlign: "left",
                fontWeight: "700",
              }}>
                {cityLabel}
              </Text>
            </View>

            {/* TODAY & TOMORROW WEATHER */}
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between", 
              borderBottomWidth: 0.5, 
              borderColor: theme.border 
            }}>
              {/* TODAY */}
              <View style={{ flex: 1, marginRight: 8, backgroundColor: "transparent", padding: 16, alignItems: "center" }}>
                <Text style={{ 
                  color: "#fff", //theme.text, 
                  fontSize: 12, 
                  fontWeight: "700", 
                  marginBottom: 8, 
                  borderColor: theme.border, 
                  borderBottomWidth: 1,
                  borderTopWidth: 1,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderRadius: 16,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: "#0453d7",
                }}>
                  {t("today")} {"01.06"}
                </Text>

                <View style={{ 
                  display: "flex", 
                  flexDirection: "row", 
                  alignItems: "center", 
                  marginBottom: 7
                }}>
                  <LottieView
                    source={pickWeatherLottie(current!.weathercode)}
                    autoPlay
                    loop
                    style={{ width: 60, height: 60, alignSelf: "center" }}
                  />

                  <Text style={{ fontSize: 40, fontWeight: "600", color: theme.text, textAlign: "center", marginLeft: -2 }}>
                    {Math.round(current!.temperature)}°
                  </Text>
                </View>

                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "700", 
                  color: theme.subText,
                  marginBottom: 8,
                }}>
                  맑음
                </Text>

                <View style={{ flexDirection: "row", justifyContent: "space-evenly", marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: theme.subText, marginRight: 7 }}>
                    최저 <Text style={{ fontSize: 18, color: theme.subText, marginRight: 5 }}>-9°</Text>
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.subText }}>
                    최고 <Text style={{ fontSize: 18, color: theme.subText, marginLeft: 2 }}>2°</Text>
                  </Text>
                </View>

              </View>

              {/* TOMORROW */}
              <View style={{ flex: 1, marginRight: 8, backgroundColor: "transparent", padding: 16, alignItems: "center" }}>
                <Text style={{ 
                  color: theme.text, 
                  fontSize: 12, 
                  fontWeight: "700", 
                  marginBottom: 8, 
                  borderColor: theme.border, 
                  borderBottomWidth: 1,
                  borderTopWidth: 1,
                  borderLeftWidth: 1,
                  borderRightWidth: 1,
                  borderRadius: 16,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}>
                  {t("tomorrow")} {"01.05"}
                </Text>

                <View style={{ 
                  display: "flex", 
                  flexDirection: "row", 
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                  paddingBottom: 7,
                  marginBottom: 7,
                }}>
                  <View style={{ flex: 2, marginRight: 10, alignItems: "center" }}>
                    <Text>최저</Text>
                    <Text style={{ fontSize: 36, fontWeight: "700", color: theme.subText }}>-7°</Text>
                  </View>
                  <View style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>
                    <Text style={{ fontSize: 24, fontWeight: "400", color: theme.subText, marginTop: 10 }}>/</Text>
                  </View>
                  <View style={{ flex: 2, marginLeft: 10, alignItems: "center" }}>
                    <Text>최고</Text>
                    <Text style={{ fontSize: 36, fontWeight: "700", color: theme.subText }}>4°</Text>
                  </View>
                </View>

                <View style={{ display: "flex", flexDirection: "column", margin: "auto", width: "60%" }}>
                  <View style={{ display: "flex", flexDirection: "row", alignContent: "center", justifyContent: "flex-start" }}>
                    <Text style={{ fontSize: 15, marginTop: 4, marginRight: 5, height: 25, display: "flex", alignItems: "center" }}>낮</Text>
                    <LottieView
                      source={pickWeatherLottie(current!.weathercode)}
                      autoPlay
                      loop
                      style={{ width: 25, height: 25, marginRight: 5 }}
                    />
                    <Text style={{ fontSize: 15, marginTop: 4, fontWeight: "700", color: theme.subText }}>구름조금</Text>
                  </View>
                  <View style={{ display: "flex", flexDirection: "row", alignContent: "center", justifyContent: "flex-start" }}>
                    <Text style={{ fontSize: 15, marginTop: 4, marginRight: 5, height: 25, display: "flex", alignItems: "center" }}>밤</Text>
                    <LottieView
                      source={pickWeatherLottie(current!.weathercode)}
                      autoPlay
                      loop
                      style={{ width: 25, height: 25, marginRight: 5 }}
                    />
                    <Text style={{ fontSize: 15, marginTop: 4, fontWeight: "700", color: theme.subText }}>흐림</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* INFO */}
        <View style={{ 
          display: "flex", 
          flexDirection: "row", 
          borderBottomWidth: 0.5, 
          borderColor: theme.border, 
          paddingHorizontal: 24,
          paddingTop: 7,
          paddingBottom: 35
        }}>
          <Text style={{ color: "#0061bf", fontSize: 12.5, marginRight: 7 }}>날씨아이콘 ⓘ</Text>
          <Text style={{ color: "#555", fontSize: 12.5, marginRight: 7  }}>시간별예보기준 ⓘ</Text>
          <Text style={{ color: "#555", fontSize: 12.5, marginRight: 7  }}>2026.01.05 12:12 업데이트</Text>
          {/* <HeroUpdateStatus update={update} /> */}
        </View>
        
        <View style={{ display: "flex", flexDirection: "column", padding: 24 }}>

          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            오늘의 생활·보건 지수 <Text style={{ fontSize: 16, color: "#888" }}>ⓘ</Text>
          </Text>

          <View style={{ 
            flexDirection: "row", 
            alignItems: "center", 
            justifyContent: "space-evenly", 
            gap: 12, 
            marginTop: 35 
          }}>

            <View style={{ flexDirection: "column", alignItems: "center", gap: 12 }}>
              <AnimatedCircularGauge value={stagnationScore} />
              <View style={{ marginTop: -5, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: stagnationLv === "경고" ? "#E53935" : "#555" }}>
                  {stagnationLv}
                </Text>
                <Text style={{ fontWeight: "700", marginTop: 10 }}>대기정체지수</Text>
              </View>
            </View>

            <View style={{ flexDirection: "column", alignItems: "center", gap: 12 }}>
              <AnimatedCircularGauge value={uvScore} />
              <View style={{ marginTop: -5, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: stagnationLv === "경고" ? "#E53935" : "#555" }}>
                  {uvLv}
                </Text>
                <Text style={{ fontWeight: "700", marginTop: 10 }}>자외선지수</Text>
              </View>
            </View>

            <View style={{ flexDirection: "column", alignItems: "center", gap: 12 }}>
              <AnimatedCircularGauge value={coldScore} />
              <View style={{ marginTop: -5, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: stagnationLv === "경고" ? "#E53935" : "#555" }}>
                  {coldLv}
                </Text>
                <Text style={{ fontWeight: "700", marginTop: 10 }}>감기지수</Text>
              </View>
            </View>

            <View style={{ flexDirection: "column", alignItems: "center", gap: 12 }}>
              <AnimatedCircularGauge value={cardioScore} />
              <View style={{ marginTop: -5, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: stagnationLv === "경고" ? "#E53935" : "#555" }}>
                  {cardioLv}
                </Text>
                <Text style={{ fontWeight: "700", marginTop: 10 }}>심뇌혈관질환지수</Text>
              </View>
            </View>

          </View>
        </View>
        
        {/* WEEKLY GRAPH (기존 MAPS 주석 잘못되어 있어서 이름만 정리) */}
        <View style={{ padding: 24, borderTopWidth: 0.5, borderColor: theme.border }}>
          {canDrawWeekly ? (
            hasRain ? (
              <WeeklyWeatherComboChartInteractive
                width={chartW}
                days={days7}
                maxTemps={max7}
                minTemps={min7}
                precipitation={rain7}
                onSelectDay={setSelectedDayIndex}
              />
            ) : (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <Text style={{ color: "#999", fontSize: 14 }}>
                  이번 주는 강수량이 거의 없어요 ☀️
                </Text>
              </View>
            )
          ) : (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text style={{ color: "#999", fontSize: 14 }}>
                주간 예보 데이터 로딩 중…
              </Text>
            </View>
          )}
        </View>

        <Text style={{ 
          padding: 24, 
          fontSize: 18, 
          fontWeight: "700", 
          borderTopWidth: 0.5,
          borderColor: theme.border
        }}>
          미세먼지 지도
        </Text>

        {/* MAPS */}
        <View style={{ paddingHorizontal: 0, paddingBottom: 24 }}>
          {coords && current ? (
            <View
              style={{
                width: "100%",
                height: 420,
                position: "relative",            // ✅ 오버레이 기준
                borderWidth: 1,
                borderColor: theme.border,
                overflow: "hidden",
              }}
              pointerEvents="box-none"           // ✅ 자식이 터치 받게
            >
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ width: "100%", height: "100%" }}
                initialRegion={{
                  latitude: coords.lat,
                  longitude: coords.lon,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled
                zoomEnabled
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {/* ✅ 현재 위치 마커 */}
                <Marker 
                  coordinate={{ latitude: coords.lat, longitude: coords.lon }}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges={markerTracking}
                >
                  <View style={{ alignItems: "center" }}>
                    <View
                      style={{
                        backgroundColor: "#f2bd37ff",
                        opacity: 0.85,
                        paddingHorizontal: 25,
                        paddingVertical: 25,
                        borderRadius: 150,
                        alignItems: "center",
                        minWidth: 100,
                        borderWidth: 2,
                        borderColor: "#E5E6E7",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "500" }}>
                        {cityLabel}
                      </Text>
                      <Text style={{ color: "#131313", fontSize: 26, fontWeight: "800", paddingVertical: 7 }}>
                        {pmValue != null ? Math.round(pmValue) : "-"}
                      </Text>
                      <View style={{ display: "flex", flexDirection:"column" }}>
                        <Text style={{ color: "#565656", fontSize: 12, fontWeight: "600" }}>
                          미세먼지타입 <Text style={{ color: "#232323" }}>{pmLabel}</Text>
                        </Text>
                        <Text style={{ color: "#565656", fontSize: 12, fontWeight: "600", marginTop: 5 }}>
                          미세먼지상태 <Text style={{ color: "#232323" }}>{pmType === "PM25" ? pm25Lv : pm10Lv}</Text>
                        </Text>
                      </View>

                    </View>

                    {/* 아래 화살표 */}
                    <View
                      style={{
                        width: 0,
                        height: 0,
                        borderLeftWidth: 6,
                        borderRightWidth: 6,
                        borderTopWidth: 8,
                        borderLeftColor: "transparent",
                        borderRightColor: "transparent",
                        borderTopColor: "#f2bd37ff",
                        marginTop: -1,
                      }}
                    />
                  </View>
                </Marker>

                {/* ✅ 즐겨찾기 마커 */}
                {favoriteMarkers.map(c => (
                  <Marker
                    key={String(c.id)}
                    coordinate={{ latitude: c.lat, longitude: c.lon }}
                  >
                    <View
                      style={{
                        backgroundColor: "#f2bd37ff",
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderRadius: 12,
                        maxWidth: 140,
                      }}
                    >
                      <Text numberOfLines={1} style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                        {c.name}
                      </Text>
                    </View>
                  </Marker>
                ))}
              </MapView>

              {/* ✅ PM 토글 오버레이 (MapView 밖, 하지만 같은 컨테이너 안) */}
              <View
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  flexDirection: "row",
                  opacity: 0.8,
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  overflow: "hidden",
                  zIndex: 9999,        // ✅ iOS
                  elevation: 8,        // ✅ Android
                }}
                pointerEvents="auto"
              >
                {PM_TABS.map(tab => (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      console.log("PM toggle:", tab.key);   // ✅ 눌리는지 확인
                      setPmType(tab.key);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: pmType === tab.key ? "#f2bd37ff" : "#fff",
                    }}
                  >
                    <Text style={{ color: pmType === tab.key ? "#131313" : "#333", fontWeight: "700" }}>
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text style={{ color: "#999", fontSize: 14 }}>위치/날씨 로딩 중…</Text>
            </View>
          )}
        </View>

        <View style={{ padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            대기 상태
          </Text>

          <View style={{ marginTop: 16 }}>
            <Text>
              초미세먼지(PM2.5):{" "}
              <Text style={{ color: levelColor(pm25Lv), fontWeight: "700" }}>
                {pm25Lv} {air?.pm2_5 != null && `(${air.pm2_5}㎍/㎥)`}
              </Text>
            </Text>

            <Text style={{ marginTop: 8 }}>
              미세먼지(PM10):{" "}
              <Text style={{ color: levelColor(pm10Lv), fontWeight: "700" }}>
                {pm10Lv} {air?.pm10 != null && `(${air.pm10}㎍/㎥)`}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
}
