import { useEffect, useState } from "react";

type AirQuality = {
  pm10?: number;
  pm2_5?: number;
  european_aqi?: number;
  us_aqi?: number;
};

export function useAirQuality(lat?: number, lon?: number) {
  const [data, setData] = useState<AirQuality | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lon) return;

    let cancelled = false;
    setLoading(true);

    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&current=pm10,pm2_5,european_aqi,us_aqi`
    )
      .then(res => res.json())
      .then(json => {
        if (!cancelled) {
          setData(json.current ?? null);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  return { data, loading };
}
