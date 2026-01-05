import AsyncStorage from "@react-native-async-storage/async-storage";

export type LocalizedText = {
  ko: string;
  en: string;
};

export type City = {
  id: string;
  name: LocalizedText;
  country?: LocalizedText;
  lat: number;
  lon: number;
  favorite?: boolean;
};


const STORAGE_KEY = "CITIES_V1";

async function saveCities(cities: City[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}

export async function loadCities(): Promise<City[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as City[];
  } catch (e) {
    console.warn("loadCities failed", e);
    return [];
  }
}

export async function upsertCity(city: City, current?: City[]) {
  const cities = current ?? (await loadCities());
  const idx = cities.findIndex((c) => c.id === city.id);

  let next: City[];
  if (idx >= 0) {
    next = [...cities];
    // 기존 favorite 유지(새 city에 favorite가 없으면)
    const prevFav = cities[idx].favorite ?? false;
    next[idx] = { ...cities[idx], ...city, favorite: city.favorite ?? prevFav };
  } else {
    next = [{ ...city, favorite: city.favorite ?? false }, ...cities];
  }

  await saveCities(next);
  return next;
}

// ✅ 기존 코드 호환
export async function addCity(city: City, current?: City[]) {
  return upsertCity(city, current);
}

export async function removeCity(id: string) {
  const cities = await loadCities();
  const next = cities.filter((c) => c.id !== id);
  await saveCities(next);
  return next;
}

// ✅ 즐겨찾기 토글
export async function toggleFavorite(id: string) {
  const cities = await loadCities();
  const idx = cities.findIndex((c) => c.id === id);
  if (idx < 0) return { cities, favorite: false };

  const next = [...cities];
  const fav = !(next[idx].favorite ?? false);
  next[idx] = { ...next[idx], favorite: fav };

  await saveCities(next);
  return { cities: next, favorite: fav };
}
