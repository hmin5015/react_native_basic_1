import { Text } from "react-native";

type Props = {
  code?: number;
  size?: number;
};

export function WeatherIcon({ code, size = 64 }: Props) {
  let icon = "☀️";

  if ([1, 2, 3].includes(code ?? -1)) icon = "⛅️";
  else if (code && code >= 61 && code <= 67) icon = "🌧️";
  else if (code && code >= 71 && code <= 77) icon = "❄️";
  else if (code && code >= 95) icon = "⛈️";

  return (
    <Text style={{ fontSize: size, lineHeight: size * 1.1 }}>
      {icon}
    </Text>
  );
}
