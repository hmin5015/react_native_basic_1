import React from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Polyline, Rect, Line, Text as SvgText } from "react-native-svg";

const WIDTH = Dimensions.get("window").width - 32;
const HEIGHT = 220;
const PADDING = 28;
const BAR_WIDTH = 14;

type Props = {
  days: string[];
  maxTemps: number[];
  minTemps: number[];
  precipitation: number[];
};

export function WeeklyWeatherComboChart({
  days,
  maxTemps,
  minTemps,
  precipitation,
}: Props) {
  if (!days?.length) return null;

  const allTemps = [...maxTemps, ...minTemps];
  const maxTemp = Math.max(...allTemps);
  const minTemp = Math.min(...allTemps);
  const maxRain = Math.max(...precipitation, 1);

  const scaleX = (i: number) =>
    PADDING + (i / (days.length - 1)) * (WIDTH - PADDING * 2);

  const scaleTempY = (t: number) =>
    PADDING +
    ((maxTemp - t) / (maxTemp - minTemp)) *
      (HEIGHT - PADDING * 2);

  const scaleRainY = (v: number) =>
    PADDING +
    ((maxRain - v) / maxRain) *
      (HEIGHT - PADDING * 2);

  const maxLine = maxTemps.map((t, i) => `${scaleX(i)},${scaleTempY(t)}`).join(" ");
  const minLine = minTemps.map((t, i) => `${scaleX(i)},${scaleTempY(t)}`).join(" ");

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ fontWeight: "800", marginBottom: 12 }}>
        일주일 날씨 요약
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

        {/* 강수량 바 */}
        {precipitation.map((v, i) => {
          const x = scaleX(i) - BAR_WIDTH / 2;
          const y = scaleRainY(v);
          const h = HEIGHT - PADDING - y;

          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={BAR_WIDTH}
              height={h}
              rx={3}
              fill={v > 0 ? "#90CAF9" : "#ECEFF1"}
            />
          );
        })}

        {/* 최고 / 최저 기온 라인 */}
        <Polyline points={maxLine} fill="none" stroke="#E53935" strokeWidth={2.5} />
        <Polyline points={minLine} fill="none" stroke="#1E88E5" strokeWidth={2.5} />

        {/* 날짜 */}
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

      <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
        <Text style={{ color: "#E53935" }}>● 최고</Text>
        <Text style={{ color: "#1E88E5" }}>● 최저</Text>
        <Text style={{ color: "#90CAF9" }}>■ 강수</Text>
      </View>
    </View>
  );
}
