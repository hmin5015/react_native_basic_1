import React from "react";
import { View, Text } from "react-native";
import Svg, { Rect, Line, Text as SvgText, Path } from "react-native-svg";
import { Animated } from "react-native";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

type Props = {
  width: number;
  height?: number;
  days: string[];          // daily.time (YYYY-MM-DD)
  maxTemps: number[];      // daily.temperature_2m_max
  minTemps: number[];      // daily.temperature_2m_min
  precipitation: number[]; // daily.precipitation_sum
  onSelectDay?: (index: number) => void;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtMMDD(dateStr: string) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

function buildPath(points: { x: number; y: number }[]) {
  if (!points.length) return "";
  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
}

export function WeeklyWeatherComboChartInteractive({
  width,
  height = 240,
  days,
  maxTemps,
  minTemps,
  precipitation,
}: Props) {
  const PADDING = 28;
  const BAR_WIDTH = 14;

  const n = Math.min(days.length, maxTemps.length, minTemps.length, precipitation.length);
  const d7 = days.slice(0, n);
  const max7 = maxTemps.slice(0, n);
  const min7 = minTemps.slice(0, n);
  const rain7 = precipitation.slice(0, n);

  const [selected, setSelected] = React.useState<number | null>(null);

  // 애니메이션 (0 -> 1)
  const progress = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [n, d7.join("|"), max7.join("|"), min7.join("|"), rain7.join("|")]);

  if (n < 2) return null;

  const allTemps = [...max7, ...min7];
  const tMax = Math.max(...allTemps);
  const tMin = Math.min(...allTemps);
  const rMax = Math.max(...rain7, 1);

  const xOf = (i: number) =>
    PADDING + (i / (n - 1)) * (width - PADDING * 2);

  const yTemp = (t: number) =>
    PADDING + ((tMax - t) / (tMax - tMin || 1)) * (height - PADDING * 2);

  const yRain = (r: number) =>
    PADDING + ((rMax - r) / rMax) * (height - PADDING * 2);

  const maxPts = max7.map((t, i) => ({ x: xOf(i), y: yTemp(t) }));
  const minPts = min7.map((t, i) => ({ x: xOf(i), y: yTemp(t) }));

  const maxPath = buildPath(maxPts);
  const minPath = buildPath(minPts);

  // Path length는 대략치로 충분 (dash 애니메이션용)
  const approxLen = (pts: { x: number; y: number }[]) => {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len || 1;
  };
  const maxLen = approxLen(maxPts);
  const minLen = approxLen(minPts);

  const maxDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [maxLen, 0],
  });
  const minDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [minLen, 0],
  });

  const tooltip = selected != null
    ? {
        x: xOf(selected),
        date: fmtMMDD(d7[selected]),
        max: Math.round(max7[selected]),
        min: Math.round(min7[selected]),
        rain: Number((rain7[selected] ?? 0).toFixed(1)),
      }
    : null;

  return (
    <View style={{ marginTop: 5 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 10 }}>일주일 날씨 요약</Text>

      <View style={{ position: "relative" }}>
        <Svg width={width} height={height}>
          {/* grid lines */}
          {[0, 0.5, 1].map((v, i) => (
            <Line
              key={i}
              x1={PADDING}
              x2={width - PADDING}
              y1={PADDING + v * (height - PADDING * 2)}
              y2={PADDING + v * (height - PADDING * 2)}
              stroke="#eee"
            />
          ))}

          {/* rain bars (animated height) */}
          {rain7.map((r, i) => {
            const x = xOf(i) - BAR_WIDTH / 2;
            const y = yRain(r);
            const fullH = height - PADDING - y;

            const h = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, fullH],
            });

            const yAnim = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [height - PADDING, y],
            });

            return (
              <AnimatedRect
                key={`bar-${i}`}
                x={x}
                y={yAnim as any}
                width={BAR_WIDTH}
                height={h as any}
                rx={3}
                fill={r > 0 ? "#90CAF9" : "#ECEFF1"}
              />
            );
          })}

          {/* temp lines (draw animation) */}
          <AnimatedPath
            d={maxPath}
            fill="none"
            stroke="#E53935"
            strokeWidth={2.5}
            strokeDasharray={`${maxLen} ${maxLen}`}
            strokeDashoffset={maxDashoffset as any}
            strokeLinecap="round"
          />
          <AnimatedPath
            d={minPath}
            fill="none"
            stroke="#1E88E5"
            strokeWidth={2.5}
            strokeDasharray={`${minLen} ${minLen}`}
            strokeDashoffset={minDashoffset as any}
            strokeLinecap="round"
          />

          {/* touch hit areas per day */}
          {d7.map((_, i) => {
            const x = xOf(i);
            const left = i === 0 ? PADDING : (xOf(i - 1) + x) / 2;
            const right = i === n - 1 ? width - PADDING : (x + xOf(i + 1)) / 2;
            return (
              <Rect
                key={`hit-${i}`}
                x={left}
                y={PADDING}
                width={right - left}
                height={height - PADDING * 1.2}
                fill="transparent"
                onPress={() => setSelected(i)}
              />
            );
          })}

          {/* selected vertical line */}
          {selected != null && (
            <Line
              x1={xOf(selected)}
              x2={xOf(selected)}
              y1={PADDING}
              y2={height - PADDING}
              stroke="#bbb"
              strokeDasharray="4 4"
            />
          )}

          {/* day labels */}
          {d7.map((d, i) => (
            <SvgText
              key={`day-${d}`}
              x={xOf(i)}
              y={height - 6}
              fontSize="10"
              fill="#555"
              textAnchor="middle"
            >
              {new Date(d).getDate()}
            </SvgText>
          ))}
        </Svg>

        {/* tooltip (View overlay) */}
        {tooltip && (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: clamp(tooltip.x - 72, 6, width - 150),
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#eee",
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
              minWidth: 140,
            }}
          >
            <Text style={{ fontWeight: "800", marginBottom: 4 }}>
              {tooltip.date}
            </Text>
            <Text style={{ fontSize: 12, color: "#444" }}>
              최고 {tooltip.max}° / 최저 {tooltip.min}°
            </Text>
            <Text style={{ fontSize: 12, color: "#444" }}>
              강수 {tooltip.rain} mm
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 6 }}>
        <Text style={{ color: "#E53935" }}>● 최고</Text>
        <Text style={{ color: "#1E88E5" }}>● 최저</Text>
        <Text style={{ color: "#90CAF9" }}>■ 강수</Text>
        <Text style={{ color: "#999" }}>터치해서 확인</Text>
      </View>
    </View>
  );
}
