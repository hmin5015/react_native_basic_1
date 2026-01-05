import { useQuery } from "@tanstack/react-query";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export function useOpenMeteo(lat: number, lon: number) {
  return useQuery({
    queryKey: ["open-meteo", lat, lon],
    enabled: !!lat && !!lon,
    queryFn: async () => {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        timezone: "auto",

        current_weather: "true",

        hourly: [
          "temperature_2m",
          "apparent_temperature",
          "relativehumidity_2m",
          "windspeed_10m",
          "precipitation_probability",
        ].join(","),

        daily: [
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_sum",
          "uv_index_max",
          "sunrise",
          "sunset",
        ].join(","),
      });

      const res = await fetch(`${BASE_URL}?${params.toString()}`);
      if (!res.ok) throw new Error("Open-Meteo fetch failed");
      return res.json();
    },
  });
}
