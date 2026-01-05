import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  value: number; // 0 ~ 100
  size?: number;
  strokeWidth?: number;
  duration?: number;
};

export function AnimatedCircularGauge({
  value,
  size = 58,
  strokeWidth = 7,
  duration = 800,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedValue = useRef(new Animated.Value(0)).current;

  const clamped = Math.min(100, Math.max(0, value));

  const color =
    clamped >= 80
      ? "#fd9a06" // 나쁨 (빨강)
      : clamped >= 50
      ? "#00c73c" // 주의 (주황)
      : "#32a1ff"; // 좋음 (초록)

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clamped,
      duration,
      useNativeDriver: false, // SVG는 false
    }).start();
  }, [clamped]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
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

        {/* animated progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* center value */}
      <Text
        style={{
          position: "absolute",
          fontWeight: "500",
          fontSize: 16,
          color: color
        }}
      >
        {clamped}
      </Text>
    </View>
  );
}
