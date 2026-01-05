export function weatherCodeToText(code?: number) {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code ?? -1)) return "Partly cloudy";
  if (code && code >= 45 && code <= 48) return "Fog";
  if (code && code >= 51 && code <= 57) return "Drizzle";
  if (code && code >= 61 && code <= 67) return "Rain";
  if (code && code >= 71 && code <= 77) return "Snow";
  if (code && code >= 80 && code <= 82) return "Showers";
  if (code && code >= 95) return "Thunderstorm";
  return "Unknown";
}

export function weatherCodeToIcon(code?: number) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code ?? -1)) return "⛅️";
  if (code && code >= 61 && code <= 67) return "🌧️";
  if (code && code >= 71 && code <= 77) return "❄️";
  if (code && code >= 95) return "⛈️";
  return "🌡️";
}

export function pickWeatherLottie(code?: number) {
  if (code == null) return require("../../assets/lottie/clear.json");
  if (code < 3) return require("../../assets/lottie/clear.json");
  if (code < 50) return require("../../assets/lottie/clouds.json");
  if (code < 70) return require("../../assets/lottie/rain.json");
  if (code < 90) return require("../../assets/lottie/snow.json");
  return require("../../assets/lottie/thunder.json");
}