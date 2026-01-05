export function pm25Level(v?: number) {
  if (v == null) return "정보없음";
  if (v <= 15) return "좋음";
  if (v <= 35) return "보통";
  if (v <= 75) return "나쁨";
  return "매우나쁨";
}

export function pm10Level(v?: number) {
  if (v == null) return "정보없음";
  if (v <= 30) return "좋음";
  if (v <= 80) return "보통";
  if (v <= 150) return "나쁨";
  return "매우나쁨";
}

export function levelColor(level: string) {
  switch (level) {
    case "좋음":
      return "#32a1ff";
    case "보통":
      return "#43A047";
    case "나쁨":
      return "#FB8C00";
    case "매우나쁨":
      return "#E53935";
    default:
      return "#999";
  }
}

// PM2.5 수치 → 지도 마커 배경색
export function pmMarkerColor(pm25?: number) {
  if (pm25 == null) return "#9E9E9E";
  if (pm25 <= 15) return "#32a1ff";   // 좋음
  if (pm25 <= 35) return "#43A047";   // 보통
  if (pm25 <= 75) return "#FB8C00";   // 나쁨
  return "#E53935";                   // 매우나쁨
}
