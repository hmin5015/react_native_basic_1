import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActionSheetIOS,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { loadCities, removeCity, City } from "../src/shared/cityStore";
import { TopBar } from "../src/ui/TopBar";
import { useThemeColors } from "../src/ui/theme";
import { useI18n } from "../src/hooks/useI18n";

export default function CitiesPage() {
  const router = useRouter();
  const theme = useThemeColors();
  const { t, lang } = useI18n();

  const [cities, setCities] = React.useState<City[]>([]);

  /* ---------- load ---------- */
  const refresh = React.useCallback(async () => {
    const list = await loadCities();
    setCities(list);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  /* ---------- actions ---------- */

  const confirmRemove = (city: City) => {
    Alert.alert(
      t("remove_city"),
      `${city.name[lang]} ${t("remove_confirm")}`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("remove"),
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            await removeCity(city.id);
            refresh();
          },
        },
      ]
    );
  };

  const openActions = (city: City) => {
    const title = city.name[lang];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [t("cancel"), t("edit"), t("remove")],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (idx) => {
          if (idx === 1) router.push(`/search?id=${city.id}` as any);
          if (idx === 2) confirmRemove(city);
        }
      );
    } else {
      Alert.alert(title, undefined, [
        { text: t("edit"), onPress: () => router.push(`/search?id=${city.id}` as any) },
        { text: t("remove"), style: "destructive", onPress: () => confirmRemove(city) },
        { text: t("cancel"), style: "cancel" },
      ]);
    }
  };

  /* ---------- data ---------- */

  const favorites = cities.filter((c) => c.favorite);
  const others = cities.filter((c) => !c.favorite);

  /* ---------- swipe ---------- */

  const renderRightActions = (city: City, _: any, dragX: any) => {
    const translateX = dragX.interpolate({
      inputRange: [-60, 0],
      outputRange: [0, 70],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          transform: [{ translateX }],
          marginBottom: 12,
          marginLeft: 5,
        }}
      >
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            confirmRemove(city);
          }}
          style={{
            backgroundColor: "#ff3b30",
            justifyContent: "center",
            alignItems: "center",
            width: 64,
            borderRadius: 18,
            height: "100%",
          }}
        >
          <Feather name="trash-2" size={22} color="white" />
        </Pressable>
      </Animated.View>
    );
  };

  const CityRow = ({ city }: { city: City }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(city, progress, dragX)
      }
      overshootRight={false}
      friction={2}
    >
      <Pressable
        onPress={() => router.push(`/city/${city.id}` as any)}
        style={{
          backgroundColor: theme.card,
          borderRadius: 18,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>
              {city.favorite ? "★ " : ""}
              {city.name[lang]}
            </Text>
            <Text style={{ color: theme.subText, marginTop: 6 }}>
              {city.country?.[lang] ?? ""} · {city.lat.toFixed(2)}, {city.lon.toFixed(2)}
            </Text>
          </View>

          <Pressable
            onPress={() => openActions(city)}
            hitSlop={12}
            style={{ paddingHorizontal: 6, paddingVertical: 4 }}
          >
            <Feather
              name="more-horizontal"
              size={22}
              color={theme.subText}
            />
          </Pressable>
        </View>
      </Pressable>
    </Swipeable>
  );

  /* ---------- render ---------- */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <StatusBar style={theme.background === "#FFFFFF" ? "dark" : "light"} />

      <TopBar
        title={t("cities")}
        left={
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>←</Text>
          </Pressable>
        }
        right={
          <Pressable onPress={() => router.push("/search" as any)}>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>+</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {favorites.length > 0 && (
          <>
            <Text style={{ color: theme.text, fontWeight: "900", marginBottom: 10 }}>
              {t("favorites")}
            </Text>
            {favorites.map((c) => (
              <CityRow key={c.id} city={c} />
            ))}
            <View style={{ height: 10 }} />
          </>
        )}

        <Text style={{ color: theme.text, fontWeight: "900", marginBottom: 10 }}>
          {t("all_cities")}
        </Text>

        {others.map((c) => (
          <CityRow key={c.id} city={c} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
