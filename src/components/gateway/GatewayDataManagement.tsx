import {
  Bookmark,
  ChevronDown,
  Download,
  MessageSquarePlus,
  Search,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { GatewayDeviceItem } from "../../types/gateway";

interface GatewayDataManagementProps {
  devices: GatewayDeviceItem[];
}

interface DataPoint {
  idx: number;
  time: string;
  value: number;
  compareValue: number;
  secondaryValue: number;
}

interface SavedQueryItem {
  id: string;
  name: string;
  deviceId: string;
  pointKey: string;
  range: string;
  agg: string;
}

function generateSeries(
  seedStr: string,
  pointKey: string,
  totalCount: number,
  rangeLabel: string
): DataPoint[] {
  const isHumidity = pointKey.includes("humidity");
  const isPressure = pointKey.includes("pressure");
  const baseMin = isHumidity ? 42 : isPressure ? 99 : 15;
  const baseMax = isHumidity ? 72 : isPressure ? 103.5 : 35;
  const mid = (baseMin + baseMax) / 2;
  const amp = (baseMax - baseMin) / 2;

  let seedHash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seedHash = (seedHash * 31 + seedStr.charCodeAt(i)) % 997;
  }

  const stepSeconds =
    rangeLabel === "近15分钟"
      ? 1
      : rangeLabel === "近1小时"
        ? 2
        : rangeLabel === "近6小时"
          ? 20
          : 60;

  const baseEpoch = new Date("2026-11-17T04:35:01").getTime();
  const points: DataPoint[] = [];

  for (let i = 0; i < totalCount; i++) {
    // Periodic triangle/sine-like wave matching the 15-35C telemetry pattern in screenshot 3
    const phase = ((i + (seedHash % 17)) % 52) / 52;
    const wave = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    const jitter = Math.sin(i * 0.45 + seedHash) * (amp * 0.015);
    const val = Number(
      Math.max(baseMin, Math.min(baseMax, baseMin + wave * (amp * 2) + jitter)).toFixed(4)
    );
    const cmpVal = Number(
      Math.max(
        baseMin,
        Math.min(baseMax, mid + Math.sin(i * 0.14 + 1.2) * (amp * 0.72))
      ).toFixed(4)
    );
    const secVal = Number((val * 0.75 + 12).toFixed(4));

    const d = new Date(baseEpoch + i * stepSeconds * 1000);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    points.push({
      idx: i,
      time: `${hh}:${mm}:${ss}`,
      value: val,
      compareValue: cmpVal,
      secondaryValue: secVal,
    });
  }

  return points;
}

export function GatewayDataManagement({ devices }: GatewayDataManagementProps) {
  const [subTab, setSubTab] = useState<"query" | "cache" | "archive">("query");

  const queryableDevices = useMemo(
    () =>
      devices.filter(
        (d) => (d.sensorMetrics && d.sensorMetrics.length > 0) || d.category !== "camera"
      ),
    [devices]
  );

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    queryableDevices.find((d) => d.deviceId === "sim-temperature-01")?.id ||
      queryableDevices[0]?.id ||
      ""
  );

  const activeDevice = useMemo(
    () =>
      queryableDevices.find((d) => d.id === selectedDeviceId) ??
      queryableDevices[0],
    [queryableDevices, selectedDeviceId]
  );

  const availablePoints = useMemo(() => {
    if (activeDevice?.sensorMetrics && activeDevice.sensorMetrics.length > 0) {
      return activeDevice.sensorMetrics.map((m) => ({
        key: m.key || m.label,
        label: m.label,
      }));
    }
    return [
      { key: "temperature", label: "temperature (°C)" },
      { key: "humidity", label: "humidity (%RH)" },
    ];
  }, [activeDevice]);

  const [selectedPoint, setSelectedPoint] = useState<string>(
    availablePoints[0]?.key || "temperature"
  );
  const [timeRange, setTimeRange] = useState("近1小时");
  const [aggregation, setAggregation] = useState("均值");
  const [maxRecords, setMaxRecords] = useState(1000);

  // Multi-point & multi-device
  const [multiPoints, setMultiPoints] = useState<string[]>([]);
  const [multiDevices, setMultiDevices] = useState<string[]>([]);
  const [comparePointInput, setComparePointInput] = useState("");
  const [compareModeActive, setCompareModeActive] = useState(false);

  // SQL mode
  const [sqlMode, setSqlMode] = useState(false);
  const [sqlWhere, setSqlWhere] = useState("value >= 18.0 AND value <= 34.5");

  // Chart UI states
  const [chartType, setChartType] = useState<"line" | "bar" | "area" | "step">(
    "line"
  );
  const [timeCompare, setTimeCompare] = useState(false);
  const [annotations, setAnnotations] = useState<{ idx: number; text: string }[]>([]);
  const [annotationDraft, setAnnotationDraft] = useState("");
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
  const [correlationOpen, setCorrelationOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Zoom window (0..100%)
  const [zoomStartPct, setZoomStartPct] = useState(0);
  const [zoomEndPct, setZoomEndPct] = useState(100);

  // Saved queries
  const [savedQueries, setSavedQueries] = useState<SavedQueryItem[]>([
    {
      id: "sq-1",
      name: "温度模拟器近1小时均值",
      deviceId: selectedDeviceId,
      pointKey: "temperature",
      range: "近1小时",
      agg: "均值",
    },
  ]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [queryNonce, setQueryNonce] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2800);
  };

  // Generate raw series and downsample to max 501 visible points
  const rawSeries = useMemo(() => {
    const pts = generateSeries(
      `${activeDevice?.deviceId ?? "sim"}-${queryNonce}`,
      selectedPoint,
      maxRecords,
      timeRange
    );

    if (!sqlMode || !sqlWhere.trim()) return pts;
    // Simple real SQL WHERE condition parser for `value > X`, `value < X`, `value >= X`, `value <= X`
    const gtMatch = sqlWhere.match(/value\s*>\s*([0-9.]+)/i);
    const gteMatch = sqlWhere.match(/value\s*>=\s*([0-9.]+)/i);
    const ltMatch = sqlWhere.match(/value\s*<\s*([0-9.]+)/i);
    const lteMatch = sqlWhere.match(/value\s*<=\s*([0-9.]+)/i);

    return pts.filter((p) => {
      if (gteMatch && p.value < Number(gteMatch[1])) return false;
      if (gtMatch && p.value <= Number(gtMatch[1])) return false;
      if (lteMatch && p.value > Number(lteMatch[1])) return false;
      if (ltMatch && p.value >= Number(ltMatch[1])) return false;
      return true;
    });
  }, [activeDevice?.deviceId, selectedPoint, maxRecords, timeRange, sqlMode, sqlWhere, queryNonce]);

  const zoomedSeries = useMemo(() => {
    if (rawSeries.length === 0) return [];
    const startIdx = Math.floor((zoomStartPct / 100) * (rawSeries.length - 1));
    const endIdx = Math.max(
      startIdx + 1,
      Math.ceil((zoomEndPct / 100) * (rawSeries.length - 1))
    );
    return rawSeries.slice(startIdx, endIdx + 1);
  }, [rawSeries, zoomStartPct, zoomEndPct]);

  // Downsample to <= 501 points for SVG smoothness matching Screenshot 3 ("显示 501/1000 个点")
  const displayedSeries = useMemo(() => {
    if (zoomedSeries.length <= 501) return zoomedSeries;
    const step = (zoomedSeries.length - 1) / 500;
    const sampled: DataPoint[] = [];
    for (let i = 0; i < 501; i++) {
      sampled.push(zoomedSeries[Math.round(i * step)]);
    }
    return sampled;
  }, [zoomedSeries]);

  // Compute exact statistics matching Screenshot 3 right-hand table
  const stats = useMemo(() => {
    const src = zoomedSeries;
    const count = src.length;
    if (count === 0) {
      return {
        count: 0,
        max: "0.0000",
        min: "0.0000",
        avg: "0.0000",
        std: "0.0000",
        variance: "0.0000",
        p95: "0.0000",
        latest: "0.0000",
      };
    }
    let minVal = Infinity;
    let maxVal = -Infinity;
    let sum = 0;
    for (const p of src) {
      if (p.value < minVal) minVal = p.value;
      if (p.value > maxVal) maxVal = p.value;
      sum += p.value;
    }
    const mean = sum / count;
    let sqDiff = 0;
    for (const p of src) {
      sqDiff += (p.value - mean) ** 2;
    }
    const variance = sqDiff / count;
    const std = Math.sqrt(variance);
    const sorted = [...src].map((p) => p.value).sort((a, b) => a - b);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    const latest = src[src.length - 1].value;

    return {
      count,
      max: maxVal.toFixed(4),
      min: minVal.toFixed(4),
      avg: mean.toFixed(4),
      std: std.toFixed(4),
      variance: variance.toFixed(4),
      p95: p95.toFixed(4),
      latest: latest.toFixed(4),
    };
  }, [zoomedSeries]);

  const handleExportCsv = () => {
    const header = "index,timestamp,device,point,value\n";
    const rows = zoomedSeries
      .map(
        (p) =>
          `${p.idx},${p.time},${activeDevice?.deviceId ?? ""},${selectedPoint},${p.value}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timeseries_${activeDevice?.deviceId ?? "data"}_${selectedPoint}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify(`已导出 ${zoomedSeries.length} 条时序记录为 CSV`);
  };

  const handleSaveQuery = () => {
    const item: SavedQueryItem = {
      id: `sq-${Date.now()}`,
      name: `${activeDevice?.name ?? "设备"} · ${selectedPoint} (${timeRange})`,
      deviceId: selectedDeviceId,
      pointKey: selectedPoint,
      range: timeRange,
      agg: aggregation,
    };
    setSavedQueries((prev) => [item, ...prev]);
    notify("已保存当前查询到「我的收藏」");
  };

  // SVG Chart Geometry
  const svgW = 640;
  const svgH = 260;
  const padL = 38;
  const padR = 16;
  const padT = 16;
  const padB = 26;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const yMin = 0;
  const yMax = useMemo(() => {
    const maxV = Number(stats.max);
    return maxV > 40 ? Math.ceil(maxV / 10) * 10 + 10 : 35;
  }, [stats.max]);

  const yTicks = useMemo(() => {
    const step = yMax <= 35 ? 5 : Math.ceil(yMax / 6 / 5) * 5;
    const arr: number[] = [];
    for (let v = yMin; v <= yMax; v += step) arr.push(v);
    return arr;
  }, [yMax]);

  const chartPoints = useMemo(() => {
    const len = displayedSeries.length;
    return displayedSeries.map((pt, i) => {
      const x = len <= 1 ? padL : padL + (i / (len - 1)) * plotW;
      const y = padT + (1 - (pt.value - yMin) / (yMax - yMin || 1)) * plotH;
      const yCmp =
        padT + (1 - (pt.compareValue - yMin) / (yMax - yMin || 1)) * plotH;
      const ySec =
        padT + (1 - (pt.secondaryValue - yMin) / (yMax - yMin || 1)) * plotH;
      return { x, y, yCmp, ySec, pt };
    });
  }, [displayedSeries, plotW, plotH, yMax]);

  const mainLinePath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    if (chartType === "step") {
      return chartPoints
        .map((p, i) => {
          if (i === 0) return `M${p.x},${p.y}`;
          const prev = chartPoints[i - 1];
          return `H${p.x} V${p.y}`;
        })
        .join(" ");
    }
    return chartPoints
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
  }, [chartPoints, chartType]);

  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const base = padT + plotH;
    return `${mainLinePath} L${chartPoints[chartPoints.length - 1].x.toFixed(1)},${base} L${chartPoints[0].x.toFixed(1)},${base} Z`;
  }, [mainLinePath, chartPoints, plotH]);

  const comparePath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.yCmp.toFixed(1)}`
      )
      .join(" ");
  }, [chartPoints]);

  const secondaryPath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints
      .map(
        (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.ySec.toFixed(1)}`
      )
      .join(" ");
  }, [chartPoints]);

  // Time labels along X axis
  const xLabels = useMemo(() => {
    if (displayedSeries.length < 2) return [];
    const count = 9;
    const labels: { x: number; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.min(
        displayedSeries.length - 1,
        Math.round((i / (count - 1)) * (displayedSeries.length - 1))
      );
      const x = padL + (i / (count - 1)) * plotW;
      labels.push({ x, text: displayedSeries[idx].time });
    }
    return labels;
  }, [displayedSeries, plotW]);

  return (
    <div className="space-y-4 pb-16">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold text-[#111827]">
          {subTab === "query"
            ? "时序数据查询"
            : subTab === "cache"
              ? "实时数据缓存监控"
              : "数据清洗与归档策略"}
        </h2>

        <div className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white p-0.5 text-[12px]">
          {[
            { key: "query" as const, label: "时序数据查询" },
            { key: "cache" as const, label: "实时数据缓存" },
            { key: "archive" as const, label: "归档与导出策略" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubTab(t.key)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                subTab === t.key
                  ? "bg-[#16A34A] text-white"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {toastMsg && (
        <div className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-2 text-[12.5px] text-[#065F46]">
          {toastMsg}
        </div>
      )}

      {subTab === "query" ? (
        <>
          {/* Filter Panel matching Screenshot 3 */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3 text-[12.5px]">
            {/* Row 1 */}
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-1.5">
                <span className="text-[#374151] whitespace-nowrap">
                  设备 <span className="text-[#EF4444]">*</span>
                </span>
                <select
                  value={activeDevice?.id ?? ""}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    setQueryNonce((n) => n + 1);
                  }}
                  className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[#111827] max-w-[160px] focus:border-[#16A34A] focus:outline-none cursor-pointer"
                >
                  {queryableDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="inline-flex items-center gap-1.5">
                <span className="text-[#374151] whitespace-nowrap">
                  测点 <span className="text-[#EF4444]">*</span>
                </span>
                <select
                  value={selectedPoint}
                  onChange={(e) => {
                    setSelectedPoint(e.target.value);
                    setQueryNonce((n) => n + 1);
                  }}
                  className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[#111827] font-mono-tabular focus:border-[#16A34A] focus:outline-none cursor-pointer"
                >
                  {availablePoints.map((pt) => (
                    <option key={pt.key} value={pt.key}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="inline-flex items-center gap-1.5">
                <span className="text-[#374151] whitespace-nowrap">
                  时间范围 <span className="text-[#EF4444]">*</span>
                </span>
                <select
                  value={timeRange}
                  onChange={(e) => {
                    setTimeRange(e.target.value);
                    setQueryNonce((n) => n + 1);
                  }}
                  className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[#111827] focus:border-[#16A34A] focus:outline-none cursor-pointer"
                >
                  <option value="近15分钟">近15分钟</option>
                  <option value="近1小时">近1小时</option>
                  <option value="近6小时">近6小时</option>
                  <option value="近24小时">近24小时</option>
                </select>
              </label>

              <label className="inline-flex items-center gap-1.5">
                <span className="text-[#374151] whitespace-nowrap">聚合</span>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[#111827] focus:border-[#16A34A] focus:outline-none cursor-pointer"
                >
                  <option value="均值">均值</option>
                  <option value="最大值">最大值</option>
                  <option value="最小值">最小值</option>
                  <option value="原始值">原始值</option>
                </select>
              </label>

              <label className="inline-flex items-center gap-1.5">
                <span className="text-[#374151] whitespace-nowrap">最大记录数</span>
                <select
                  value={maxRecords}
                  onChange={(e) => setMaxRecords(Number(e.target.value))}
                  className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 font-mono-tabular text-[#111827] focus:border-[#16A34A] focus:outline-none cursor-pointer"
                >
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value={2000}>2000</option>
                </select>
              </label>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setQueryNonce((n) => n + 1);
                    notify("已完成最新时序数据检索");
                  }}
                  className="rounded-md bg-[#16A34A] hover:bg-[#15803D] px-3.5 py-1.5 font-medium text-white cursor-pointer whitespace-nowrap"
                >
                  查询
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-3 py-1.5 font-medium text-[#374151] cursor-pointer whitespace-nowrap"
                >
                  导出
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompareModeActive((v) => !v);
                    notify(
                      !compareModeActive
                        ? "已开启多测点/对比曲线叠加"
                        : "已关闭对比叠加"
                    );
                  }}
                  className="rounded-md bg-[#7FB3F5] hover:bg-[#60A5FA] px-3 py-1.5 font-medium text-white cursor-pointer whitespace-nowrap"
                >
                  对比查询
                </button>
                <button
                  type="button"
                  onClick={() => setCorrelationOpen((v) => !v)}
                  className="rounded-md bg-[#F6C47B] hover:bg-[#F59E0B] px-3 py-1.5 font-medium text-white cursor-pointer whitespace-nowrap"
                >
                  相关性分析
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuery}
                  className="rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-3 py-1.5 font-medium text-[#374151] cursor-pointer whitespace-nowrap"
                >
                  保存查询
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFavoritesOpen((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F3F4F6] px-3 py-1.5 font-medium text-[#6B7280] cursor-pointer whitespace-nowrap"
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>我的收藏</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {favoritesOpen && (
                    <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-[#E5E7EB] bg-white p-1.5 shadow-xl z-30 space-y-1">
                      {savedQueries.map((sq) => (
                        <button
                          key={sq.id}
                          type="button"
                          onClick={() => {
                            if (sq.deviceId) setSelectedDeviceId(sq.deviceId);
                            setSelectedPoint(sq.pointKey);
                            setTimeRange(sq.range);
                            setAggregation(sq.agg);
                            setFavoritesOpen(false);
                            setQueryNonce((n) => n + 1);
                          }}
                          className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] hover:bg-[#F9FAFB] flex items-center gap-2 cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                          <span className="truncate text-[#111827]">{sq.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: 多测点选择 */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[#374151] w-24 shrink-0">多测点选择：</span>
              <div className="flex-1 min-w-[260px] max-w-[380px] flex flex-wrap items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5">
                {availablePoints.map((pt) => {
                  const active = multiPoints.includes(pt.key);
                  return (
                    <button
                      key={pt.key}
                      type="button"
                      onClick={() =>
                        setMultiPoints((prev) =>
                          prev.includes(pt.key)
                            ? prev.filter((k) => k !== pt.key)
                            : [...prev, pt.key]
                        )
                      }
                      className={`rounded px-2 py-0.5 text-[11.5px] font-mono-tabular cursor-pointer transition-colors ${
                        active
                          ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                          : "bg-[#F9FAFB] text-[#6B7280] hover:text-[#111827]"
                      }`}
                    >
                      {pt.label}
                    </button>
                  );
                })}
                {multiPoints.length === 0 && (
                  <span className="text-[#9CA3AF] text-[12px]">
                    选择多个测点进行对比
                  </span>
                )}
              </div>
            </div>

            {/* Row 3: 多设备选择 & 对比测点 */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[#374151] w-24 shrink-0">多设备选择：</span>
              <select
                value={multiDevices[0] ?? ""}
                onChange={(e) =>
                  setMultiDevices(e.target.value ? [e.target.value] : [])
                }
                className="w-full sm:w-[320px] rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[#6B7280] focus:border-[#16A34A] focus:outline-none cursor-pointer"
              >
                <option value="">选择多个设备对比同一测点</option>
                {queryableDevices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.deviceId})
                  </option>
                ))}
              </select>

              <span className="text-[#374151] ml-1">对比测点：</span>
              <input
                type="text"
                value={comparePointInput}
                onChange={(e) => setComparePointInput(e.target.value)}
                placeholder="对比测点"
                className="w-36 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#16A34A] focus:outline-none"
              />

              <button
                type="button"
                onClick={() => {
                  setCompareModeActive(true);
                  notify("已加载多设备同测点对比曲线");
                }}
                className="rounded-md bg-[#8CD6A8] hover:bg-[#16A34A] px-3.5 py-1.5 font-medium text-white transition-colors cursor-pointer"
              >
                设备对比
              </button>
            </div>

            {/* Row 4: SQL模式 */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={sqlMode}
                onClick={() => setSqlMode((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer ${
                  sqlMode ? "bg-[#16A34A]" : "bg-[#D1D5DB]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                    sqlMode ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="font-medium text-[#374151]">SQL模式</span>
              <span className="text-[12px] text-[#6B7280]">
                SQL模式：输入WHERE条件，自动解析为查询参数
              </span>

              {sqlMode && (
                <div className="w-full sm:w-auto sm:flex-1 flex items-center gap-2 mt-1 sm:mt-0">
                  <input
                    type="text"
                    value={sqlWhere}
                    onChange={(e) => setSqlWhere(e.target.value)}
                    placeholder="WHERE value >= 20 AND value <= 34"
                    className="flex-1 rounded-md border border-[#A7F3D0] bg-[#F8FAFC] px-3 py-1.5 font-mono-tabular text-[12px] text-[#111827] focus:border-[#16A34A] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQueryNonce((n) => n + 1)}
                    className="inline-flex items-center gap-1 rounded-md bg-[#16A34A] px-3 py-1.5 text-[12px] text-white cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>执行</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {correlationOpen && (
            <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
              <div>
                <strong className="text-[#92400E]">相关性分析结果（Pearson r）：</strong>
                <span className="ml-2 text-[#78350F] font-mono-tabular">
                  {selectedPoint} vs humidity: r = -0.6842 (强负相关) · p &lt; 0.001
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCorrelationOpen(false)}
                className="text-[#92400E] hover:underline cursor-pointer"
              >
                收起
              </button>
            </div>
          )}

          {/* Main 2-column Chart + Statistics Table matching Screenshot 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left: 数据图表 */}
            <div className="lg:col-span-7 rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[14px] font-bold text-[#111827]">
                    数据图表
                  </h3>
                  <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[11.5px] font-medium text-[#2563EB] font-mono-tabular">
                    数据已自动降采样，显示 {displayedSeries.length}/{rawSeries.length} 个点
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Chart Type Segmented Control */}
                  <div className="inline-flex items-center rounded-md border border-[#E5E7EB] overflow-hidden text-[12px]">
                    {[
                      { key: "line" as const, label: "折线" },
                      { key: "bar" as const, label: "柱状" },
                      { key: "area" as const, label: "面积" },
                      { key: "step" as const, label: "阶梯" },
                    ].map((ct, idx) => (
                      <button
                        key={ct.key}
                        type="button"
                        onClick={() => setChartType(ct.key)}
                        className={`px-2.5 py-1 font-medium cursor-pointer transition-colors ${
                          idx > 0 ? "border-l border-[#E5E7EB]" : ""
                        } ${
                          chartType === ct.key
                            ? "bg-[#16A34A] text-white"
                            : "bg-white text-[#4B5563] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>

                  {/* 时间对比 switch */}
                  <label className="inline-flex items-center gap-1.5 text-[12px] text-[#4B5563] cursor-pointer">
                    <span>时间对比</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={timeCompare}
                      onClick={() => setTimeCompare((v) => !v)}
                      className={`relative inline-flex h-4.5 w-8 rounded-full border-2 border-transparent transition-colors cursor-pointer ${
                        timeCompare ? "bg-[#16A34A]" : "bg-[#D1D5DB]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          timeCompare ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </label>

                  <button
                    type="button"
                    onClick={() => setAnnotationModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] px-2.5 py-1 text-[12px] font-medium text-[#374151] cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>添加注解</span>
                  </button>
                </div>
              </div>

              {/* SVG Chart */}
              <div className="relative">
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-[270px] overflow-visible select-none"
                  onMouseLeave={() => setHoverIndex(null)}
                  onMouseMove={(e) => {
                    if (chartPoints.length === 0) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relX =
                      ((e.clientX - rect.left) / rect.width) * svgW - padL;
                    const ratio = Math.max(0, Math.min(1, relX / plotW));
                    setHoverIndex(
                      Math.round(ratio * (chartPoints.length - 1))
                    );
                  }}
                >
                  {/* Y Gridlines */}
                  {yTicks.map((tick) => {
                    const y =
                      padT + (1 - (tick - yMin) / (yMax - yMin || 1)) * plotH;
                    return (
                      <g key={tick}>
                        <line
                          x1={padL}
                          y1={y}
                          x2={svgW - padR}
                          y2={y}
                          stroke="#EEF2F6"
                          strokeWidth="1"
                        />
                        <text
                          x={padL - 8}
                          y={y + 3.5}
                          textAnchor="end"
                          className="fill-[#6B7280] text-[10px] font-mono-tabular"
                        >
                          {tick}
                        </text>
                      </g>
                    );
                  })}

                  {/* Main Series */}
                  {chartType === "bar" ? (
                    chartPoints
                      .filter((_, i) => i % Math.max(1, Math.floor(chartPoints.length / 80)) === 0)
                      .map((p, idx) => {
                        const base = padT + plotH;
                        return (
                          <rect
                            key={idx}
                            x={p.x - 2}
                            y={p.y}
                            width={4}
                            height={Math.max(1, base - p.y)}
                            fill="rgba(99, 102, 241, 0.72)"
                            rx="1"
                          />
                        );
                      })
                  ) : (
                    <>
                      <path
                        d={areaPath}
                        fill={
                          chartType === "area"
                            ? "rgba(99, 102, 241, 0.24)"
                            : "rgba(99, 102, 241, 0.1)"
                        }
                      />
                      <path
                        d={mainLinePath}
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth={chartType === "line" ? "1.4" : "1.8"}
                        strokeLinejoin="round"
                      />
                    </>
                  )}

                  {/* Time Compare Overlay */}
                  {timeCompare && (
                    <path
                      d={comparePath}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Multi-point / Compare Overlay */}
                  {(compareModeActive || multiPoints.length > 1) && (
                    <path
                      d={secondaryPath}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Annotations */}
                  {annotations.map((ann, idx) => {
                    const target = chartPoints[Math.min(chartPoints.length - 1, ann.idx)];
                    if (!target) return null;
                    return (
                      <g key={idx}>
                        <line
                          x1={target.x}
                          y1={padT}
                          x2={target.x}
                          y2={padT + plotH}
                          stroke="#EF4444"
                          strokeDasharray="2 2"
                        />
                        <circle cx={target.x} cy={target.y} r="4" fill="#EF4444" />
                        <rect
                          x={Math.min(svgW - 110, target.x + 4)}
                          y={padT + 4}
                          width={102}
                          height={20}
                          rx="4"
                          fill="#FEF2F2"
                          stroke="#FECACA"
                        />
                        <text
                          x={Math.min(svgW - 104, target.x + 10)}
                          y={padT + 17}
                          className="fill-[#B91C1C] text-[10px]"
                        >
                          {ann.text.slice(0, 10)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Hover Crosshair */}
                  {hoverIndex !== null && chartPoints[hoverIndex] && (
                    <>
                      <line
                        x1={chartPoints[hoverIndex].x}
                        y1={padT}
                        x2={chartPoints[hoverIndex].x}
                        y2={padT + plotH}
                        stroke="#6366F1"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={chartPoints[hoverIndex].x}
                        cy={chartPoints[hoverIndex].y}
                        r="4"
                        fill="#6366F1"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    </>
                  )}

                  {/* X Axis Baseline & Labels */}
                  <line
                    x1={padL}
                    y1={padT + plotH}
                    x2={svgW - padR}
                    y2={padT + plotH}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                  {xLabels.map((lbl, idx) => (
                    <text
                      key={idx}
                      x={lbl.x}
                      y={svgH - 6}
                      textAnchor="middle"
                      className="fill-[#6B7280] text-[9.5px] font-mono-tabular"
                    >
                      {lbl.text}
                    </text>
                  ))}
                </svg>

                {hoverIndex !== null && chartPoints[hoverIndex] && (
                  <div className="absolute top-2 right-4 rounded-lg border border-[#E5E7EB] bg-white/95 px-3 py-1.5 text-[11.5px] font-mono-tabular shadow-sm pointer-events-none">
                    <div className="text-[#6B7280]">
                      时间：{chartPoints[hoverIndex].pt.time}
                    </div>
                    <div className="font-semibold text-[#4F46E5]">
                      {selectedPoint}: {chartPoints[hoverIndex].pt.value.toFixed(4)}
                    </div>
                    {timeCompare && (
                      <div className="text-[#059669]">
                        昨日同期:{" "}
                        {chartPoints[hoverIndex].pt.compareValue.toFixed(4)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Brush / Range Zoom Slider matching Screenshot 3 */}
              <div className="mt-2 rounded-md border border-[#CBD5E1] bg-[#EFF6FF] px-3 py-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#475569]">
                  <span>
                    窗口起点：{displayedSeries[0]?.time ?? "--"} ({zoomStartPct}%)
                  </span>
                  <span>
                    窗口终点：{displayedSeries[displayedSeries.length - 1]?.time ?? "--"} ({zoomEndPct}%)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, zoomEndPct - 5)}
                    value={zoomStartPct}
                    onChange={(e) => setZoomStartPct(Number(e.target.value))}
                    aria-label="调整起始时间窗口"
                    className="w-full accent-[#6366F1] cursor-pointer"
                  />
                  <input
                    type="range"
                    min={Math.min(100, zoomStartPct + 5)}
                    max={100}
                    value={zoomEndPct}
                    onChange={(e) => setZoomEndPct(Number(e.target.value))}
                    aria-label="调整结束时间窗口"
                    className="w-full accent-[#6366F1] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right: 统计信息 Table matching Screenshot 3 */}
            <div className="lg:col-span-5 rounded-xl border border-[#E5E7EB] bg-white p-4 flex flex-col">
              <h3 className="text-[14px] font-bold text-[#111827] mb-3">
                统计信息
              </h3>

              <div className="flex-1 rounded-lg border border-[#E5E7EB] overflow-hidden">
                <table className="w-full h-full text-left border-collapse text-[13px]">
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {[
                      ["数据点数", String(stats.count)],
                      ["最大值", stats.max],
                      ["最小值", stats.min],
                      ["平均值", stats.avg],
                      ["标准差", stats.std],
                      ["方差", stats.variance],
                      ["P95分位数", stats.p95],
                      ["最新值", stats.latest],
                    ].map(([label, val]) => (
                      <tr key={label} className="hover:bg-[#F9FAFB]">
                        <td className="py-3 px-4 w-1/2 border-r border-[#E5E7EB] text-[#4B5563]">
                          {label}
                        </td>
                        <td className="py-3 px-4 font-mono-tabular font-medium text-[#111827]">
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : subTab === "cache" ? (
        /* 实时数据缓存监控 */
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <span className="text-[13.5px] font-semibold text-[#111827]">
              边缘侧内存与环形缓存测点快照
            </span>
            <span className="text-[12px] font-mono-tabular text-[#059669]">
              RingBuffer 命中率 99.4%
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#4B5563]">
                  <th className="py-2.5 px-4">设备 ID</th>
                  <th className="py-2.5 px-4">设备名称</th>
                  <th className="py-2.5 px-4">测点快照</th>
                  <th className="py-2.5 px-4">采集周期</th>
                  <th className="py-2.5 px-4">最近更新时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-3 px-4 font-mono-tabular">{d.deviceId}</td>
                    <td className="py-3 px-4 font-medium text-[#111827]">{d.name}</td>
                    <td className="py-3 px-4 font-mono-tabular text-[#374151]">
                      {d.sensorMetrics
                        ? d.sensorMetrics
                            .map((m) => `${m.label}: ${m.value}${m.unit}`)
                            .join(" | ")
                        : d.relayChannels
                          ? d.relayChannels
                              .map((c) => `${c.channel}=${c.isOn ? "ON" : "OFF"}`)
                              .join(" ")
                          : `RTSP ${d.resolution ?? "1080P"} @ ${d.fps ?? 25}fps`}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular">{d.collectInterval}s</td>
                    <td className="py-3 px-4 font-mono-tabular text-[#6B7280]">
                      {d.lastUpdate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 归档与导出策略 */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "热数据存储 (TSDB 内存/SSD)",
              value: "保留 7 天",
              desc: "原始秒级采样点直接落盘本地 SQLite/Influx 时序引擎",
            },
            {
              title: "自动降采样压缩 (LTTB)",
              value: "超过 500 点触发",
              desc: "保留波峰波谷特征，图表渲染与北向补传带宽降低 65%",
            },
            {
              title: "离线断点续传队列",
              value: "最大 100,000 条",
              desc: "网络中断时自动缓存遥测报文，恢复后按时间戳顺序补传",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-2"
            >
              <div className="text-[12.5px] text-[#6B7280]">{card.title}</div>
              <div className="text-[20px] font-bold text-[#111827] font-mono-tabular">
                {card.value}
              </div>
              <p className="text-[12px] text-[#6B7280] leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Annotation Modal */}
      {annotationModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-[#111827]">
                添加图表注解标记
              </h4>
              <button
                type="button"
                onClick={() => setAnnotationModalOpen(false)}
                className="p-1 text-[#6B7280] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={annotationDraft}
              onChange={(e) => setAnnotationDraft(e.target.value)}
              placeholder="如：开启排风扇降温"
              className="w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-[13px] focus:border-[#16A34A] focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAnnotationModalOpen(false)}
                className="rounded-lg border border-[#D1D5DB] px-3 py-1.5 text-[12px] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!annotationDraft.trim()) return;
                  const targetIdx = Math.floor(chartPoints.length * 0.6);
                  setAnnotations((prev) => [
                    ...prev,
                    { idx: targetIdx, text: annotationDraft.trim() },
                  ]);
                  setAnnotationDraft("");
                  setAnnotationModalOpen(false);
                }}
                className="rounded-lg bg-[#16A34A] px-3 py-1.5 text-[12px] text-white cursor-pointer"
              >
                添加标记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
