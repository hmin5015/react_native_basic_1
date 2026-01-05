import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  value: number; // 0 ~ 100
  size?: number;
  strokeWidth?: number;
};

export function CircularGauge({
  value,
  size = 72,
  strokeWidth = 8,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clamped = Math.min(100, Math.max(0, value));
  const progress = (clamped / 100) * circumference;

  const color =
    clamped >= 80
      ? "#E53935" // 빨강 (나쁨)
      : clamped >= 50
      ? "#FB8C00" // 주황 (주의)
      : "#43A047"; // 초록 (좋음)

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        {/* background */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#eee"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${progress}, ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* center text */}
      <Text
        style={{
          position: "absolute",
          fontWeight: "800",
          fontSize: 14,
        }}
      >
        {clamped}
      </Text>
    </View>
  );
}
