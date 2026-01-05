import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";

import { loadCities, upsertCity, City } from "../src/shared/cityStore";
import { TopBar } from "../src/ui/TopBar";
import { useThemeColors } from "../src/ui/theme";

/* ---------- types ---------- */

type GeoResult = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

/* ---------- helpers ---------- */

function sameLocation(a: { lat: number; lon: number }, b: GeoResult) {
  return (
    Math.abs(a.lat - b.latitude) < 0.0001 &&
    Math.abs(a.lon - b.longitude) < 0.0001
  );
}

/* ---------- Page ---------- */

export default function AddOrEditCityPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useThemeColors();

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GeoResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [editingCity, setEditingCity] = React.useState<City | null>(null);
  const [allCities, setAllCities] = React.useState<City[]>([]);

  /* ---------- load cities ---------- */
  React.useEffect(() => {
    loadCities().then((list) => {
      setAllCities(list);
      if (id) {
        const found = list.find((c) => c.id === id);
        if (found) {
          setEditingCity(found);
          setQuery(found.name);
        }
      }
    });
  }, [id]);

  /* ---------- search ---------- */
  const searchCity = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          text
        )}&count=6&language=en&format=json`
      );
      const json = await res.json();
      setResults(json?.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- select ---------- */
  const onSelect = async (item: GeoResult) => {
    const existing = allCities.find((c) =>
      sameLocation({ lat: c.lat, lon: c.lon }, item)
    );

    if (existing && !editingCity) {
      Alert.alert(
        "이미 존재하는 도시",
        `${existing.name}은(는) 이미 Cities에 있어요.\n수정할까요?`,
        [
          { text: "취소", style: "cancel" },
          {
            text: "수정",
            onPress: () =>
              router.replace(`/search?id=${existing.id}` as any),
          },
        ]
      );
      return;
    }

    const city: City = {
      id:
        editingCity?.id ??
        existing?.id ??
        `${item.name}-${item.latitude}-${item.longitude}`,
      name: item.name,
      country: item.country,
      lat: item.latitude,
      lon: item.longitude,
      favorite: editingCity?.favorite ?? existing?.favorite ?? false,
    };

    await upsertCity(city);

    Alert.alert(
      editingCity ? "도시 수정 완료" : "도시 추가 완료",
      item.name
    );

    router.back();
  };

  /* ---------- render item ---------- */

  const renderItem = ({ item }: { item: GeoResult }) => {
    const isCurrent =
      editingCity &&
      sameLocation({ lat: editingCity.lat, lon: editingCity.lon }, item);

    return (
      <Pressable
        onPress={() => onSelect(item)}
        style={{
          padding: 14,
          borderBottomWidth: 1,
          borderColor: theme.subText,
          backgroundColor: isCurrent ? theme.card : "transparent",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {isCurrent && (
            <Text style={{ color: theme.text, fontWeight: "900" }}>✔</Text>
          )}
          <Text style={{ color: theme.text, fontWeight: "900" }}>
            {item.name}
          </Text>
        </View>

        <Text style={{ color: theme.subText, marginTop: 4 }}>
          {item.country} · {item.latitude.toFixed(2)},{" "}
          {item.longitude.toFixed(2)}
        </Text>

        {isCurrent && (
          <Text
            style={{
              color: theme.subText,
              marginTop: 4,
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            Current city
          </Text>
        )}
      </Pressable>
    );
  };

  /* ---------- render ---------- */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <StatusBar style={theme.background === "#FFFFFF" ? "dark" : "light"} />

      <TopBar
        title={editingCity ? "Edit City" : "Add City"}
        left={
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>
              ←
            </Text>
          </Pressable>
        }
      />

      <View style={{ padding: 16 }}>
        {editingCity && (
          <View
            style={{
              backgroundColor: theme.card,
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: theme.subText, fontWeight: "800" }}>
              Editing
            </Text>
            <Text style={{ color: theme.text, marginTop: 4 }}>
              {editingCity.name}
              {editingCity.country ? ` (${editingCity.country})` : ""}
            </Text>
          </View>
        )}

        <Text style={{ color: theme.subText, marginBottom: 6 }}>
          City name
        </Text>

        <TextInput
          value={query}
          onChangeText={searchCity}
          placeholder="Search city (e.g. Seoul)"
          placeholderTextColor={theme.subText}
          style={{
            borderWidth: 1,
            borderColor: theme.subText,
            borderRadius: 12,
            padding: 12,
            color: theme.text,
            marginBottom: 12,
          }}
        />

        {loading && (
          <ActivityIndicator color={theme.text} style={{ marginVertical: 10 }} />
        )}

        <FlatList
          data={results}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          ListEmptyComponent={
            query.length > 1 && !loading ? (
              <Text
                style={{
                  color: theme.subText,
                  marginTop: 20,
                  textAlign: "center",
                }}
              >
                No results
              </Text>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}
