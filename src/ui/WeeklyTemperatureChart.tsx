import React from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Polyline, Line, Text as SvgText } from "react-native-svg";

const WIDTH = Dimensions.get("window").width - 32;
const HEIGHT = 180;
const PADDING = 24;

type Props = {
  days: string[];           // daily.time
  maxTemps: number[];       // daily.temperature_2m_max
  minTemps: number[];       // daily.temperature_2m_min
};

export function WeeklyTemperatureChart({
  days,
  maxTemps,
  minTemps,
}: Props) {
  if (!days?.length) return null;

  const temps = [...maxTemps, ...minTemps];
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);

  const scaleY = (temp: number) =>
    PADDING +
    ((maxTemp - temp) / (maxTemp - minTemp)) *
      (HEIGHT - PADDING * 2);

  const scaleX = (index: number) =>
    PADDING +
    (index / (days.length - 1)) * (WIDTH - PADDING * 2);

  const maxPoints = maxTemps
    .map((t, i) => `${scaleX(i)},${scaleY(t)}`)
    .join(" ");

  const minPoints = minTemps
    .map((t, i) => `${scaleX(i)},${scaleY(t)}`)
    .join(" ");

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ fontWeight: "800", marginBottom: 12 }}>
        일주일 기온
      </Text>

      <Svg width={WIDTH} height={HEIGHT}>
        {/* 기준선 */}
        {[0, 0.5, 1].map((v, i) => (
          <Line
            key={i}
            x1={PADDING}
            x2={WIDTH - PADDING}
            y1={PADDING + v * (HEIGHT - PADDING * 2)}
            y2={PADDING + v * (HEIGHT - PADDING * 2)}
            stroke="#eee"
          />
        ))}

        {/* 최고기온 */}
        <Polyline
          points={maxPoints}
          fill="none"
          stroke="#E53935"
          strokeWidth={2.5}
        />

        {/* 최저기온 */}
        <Polyline
          points={minPoints}
          fill="none"
          stroke="#1E88E5"
          strokeWidth={2.5}
        />

        {/* 날짜 라벨 */}
        {days.map((d, i) => (
          <SvgText
            key={d}
            x={scaleX(i)}
            y={HEIGHT - 4}
            fontSize="10"
            fill="#555"
            textAnchor="middle"
          >
            {new Date(d).getDate()}
          </SvgText>
        ))}
      </Svg>

      {/* 범례 */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
        <Text style={{ color: "#E53935" }}>● 최고</Text>
        <Text style={{ color: "#1E88E5" }}>● 최저</Text>
      </View>
    </View>
  );
}
