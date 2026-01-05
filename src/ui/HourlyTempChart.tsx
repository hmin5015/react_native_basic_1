import { View } from "react-native";
import Svg, { Polyline, Circle } from "react-native-svg";

type Props = {
  temps: number[];
};

export function HourlyTempChart({ temps }: Props) {
  if (temps.length === 0) return null;

  const width = 320;
  const height = 120;
  const padding = 10;

  const min = Math.min(...temps);
  const max = Math.max(...temps);

  const points = temps.map((t, i) => {
    const x = (i / (temps.length - 1)) * (width - padding * 2) + padding;
    const y =
      height -
      padding -
      ((t - min) / (max - min || 1)) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <View>
      <Svg width={width} height={height}>
        <Polyline
          points={points.join(" ")}
          fill="none"
          stroke="#FFE142"
          strokeWidth="3"
        />
        {points.map((p, i) => {
          const [x, y] = p.split(",");
          return (
            <Circle
              key={i}
              cx={Number(x)}
              cy={Number(y)}
              r="3"
              fill="#FFE142"
            />
          );
        })}
      </Svg>
    </View>
  );
}
