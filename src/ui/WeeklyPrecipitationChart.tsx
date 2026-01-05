import React from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";

const WIDTH = Dimensions.get("window").width - 32;
const HEIGHT = 180;
const PADDING = 24;
const BAR_WIDTH = 20;

type Props = {
  days: string[];          // daily.time
  precipitation: number[]; // daily.precipitation_sum
};

export function WeeklyPrecipitationChart({
  days,
  precipitation,
}: Props) {
  if (!days?.length) return null;

  const maxRain = Math.max(...precipitation, 1); // 0 방지

  const scaleY = (v: number) =>
    PADDING +
    ((maxRain - v) / maxRain) * (HEIGHT - PADDING * 2);

  const scaleX = (index: number) =>
    PADDING +
    (index / (days.length - 1)) * (WIDTH - PADDING * 2);

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ fontWeight: "800", marginBottom: 12 }}>
        일주일 강수량
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

        {/* 막대 */}
        {precipitation.map((v, i) => {
          const x = scaleX(i) - BAR_WIDTH / 2;
          const y = scaleY(v);
          const h =
            HEIGHT - PADDING - y;

          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={BAR_WIDTH}
              height={h}
              rx={4}
              fill={v > 0 ? "#1E88E5" : "#cfd8dc"}
            />
          );
        })}

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

      {/* 범례 */}
      <Text style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
        ■ 강수량 (mm)
      </Text>
    </View>
  );
}
