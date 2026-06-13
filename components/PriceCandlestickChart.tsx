"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type { EChartsOption, EChartsType } from "echarts";
import type { CandlePoint, Timeframe } from "./priceChartData";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type PriceCandlestickChartProps = {
  timeframe: Timeframe;
  data: CandlePoint[];
};

const timeframeLabels: Record<Timeframe, string> = {
  day: "日足",
  week: "週足",
  month: "月足",
};

const initialVisibleCounts: Record<Timeframe, number> = {
  day: 90,
  week: 24,
  month: 24,
};

const axisFollowIntervalMs = 400;
const scrollEndDelayMs = 180;
const xInsideZoomId = "x-inside-zoom";
const xSliderZoomId = "x-slider-zoom";
const xZoomIds = new Set([xInsideZoomId, xSliderZoomId]);

type DataZoomEventItem = {
  dataZoomId?: string;
  start?: number;
  end?: number;
};

type DataZoomEvent = DataZoomEventItem & {
  batch?: DataZoomEventItem[];
};

type DataZoomHandler = (...args: unknown[]) => void;

type AxisRange = {
  min: number;
  max: number;
};

type PriceRangeIndex = {
  query: (startIndex: number, endIndex: number) => AxisRange;
};

const formatYen = (value: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);

const buildAxisRange = (rawMin: number, rawMax: number) => {
  const range = rawMax - rawMin;
  const padding = range === 0 ? rawMax * 0.1 || 1 : range * 0.1;

  return {
    min: Math.max(0, rawMin - padding),
    max: rawMax + padding,
  };
};

const getVisibleIndices = (
  timestamps: number[],
  startPercent: number,
  endPercent: number,
) => {
  if (timestamps.length === 0) {
    return { startIndex: 0, endIndex: -1 };
  }

  const firstTimestamp = timestamps[0];
  const lastTimestamp = timestamps[timestamps.length - 1];
  const timestampRange = lastTimestamp - firstTimestamp;
  const startTimestamp =
    firstTimestamp + timestampRange * (startPercent / 100);
  const endTimestamp = firstTimestamp + timestampRange * (endPercent / 100);

  let startLow = 0;
  let startHigh = timestamps.length;
  while (startLow < startHigh) {
    const middle = Math.floor((startLow + startHigh) / 2);
    if (timestamps[middle] < startTimestamp) {
      startLow = middle + 1;
    } else {
      startHigh = middle;
    }
  }

  let endLow = 0;
  let endHigh = timestamps.length;
  while (endLow < endHigh) {
    const middle = Math.floor((endLow + endHigh) / 2);
    if (timestamps[middle] <= endTimestamp) {
      endLow = middle + 1;
    } else {
      endHigh = middle;
    }
  }

  return {
    startIndex: Math.min(startLow, timestamps.length - 1),
    endIndex: Math.max(0, endLow - 1),
  };
};

const buildPriceRangeIndex = (data: CandlePoint[]): PriceRangeIndex => {
  if (data.length === 0) {
    return {
      query: () => buildAxisRange(0, 0),
    };
  }

  const logarithms = new Uint8Array(data.length + 1);
  for (let index = 2; index <= data.length; index += 1) {
    logarithms[index] = logarithms[Math.floor(index / 2)] + 1;
  }

  const minTable: number[][] = [data.map((point) => point.values[2])];
  const maxTable: number[][] = [data.map((point) => point.values[3])];

  for (
    let level = 1, blockSize = 2;
    blockSize <= data.length;
    level += 1, blockSize *= 2
  ) {
    const halfBlockSize = blockSize / 2;
    const rowLength = data.length - blockSize + 1;
    const minRow = new Array<number>(rowLength);
    const maxRow = new Array<number>(rowLength);

    for (let index = 0; index < rowLength; index += 1) {
      minRow[index] = Math.min(
        minTable[level - 1][index],
        minTable[level - 1][index + halfBlockSize],
      );
      maxRow[index] = Math.max(
        maxTable[level - 1][index],
        maxTable[level - 1][index + halfBlockSize],
      );
    }

    minTable.push(minRow);
    maxTable.push(maxRow);
  }

  return {
    query: (startIndex, endIndex) => {
      const safeStart = Math.max(0, Math.min(startIndex, data.length - 1));
      const safeEnd = Math.max(safeStart, Math.min(endIndex, data.length - 1));
      const visibleLength = safeEnd - safeStart + 1;
      const level = logarithms[visibleLength];
      const blockSize = 2 ** level;
      const secondBlockStart = safeEnd - blockSize + 1;
      const rawMin = Math.min(
        minTable[level][safeStart],
        minTable[level][secondBlockStart],
      );
      const rawMax = Math.max(
        maxTable[level][safeStart],
        maxTable[level][secondBlockStart],
      );

      return buildAxisRange(rawMin, rawMax);
    },
  };
};

const getHorizontalZoomRange = (event: DataZoomEvent) => {
  const items = event.batch ?? [event];
  const horizontalZoom = items.find(
    (item) => item.dataZoomId && xZoomIds.has(item.dataZoomId),
  );

  if (
    !horizontalZoom ||
    typeof horizontalZoom.start !== "number" ||
    typeof horizontalZoom.end !== "number"
  ) {
    return null;
  }

  return {
    startPercent: horizontalZoom.start,
    endPercent: horizontalZoom.end,
  };
};

export function PriceCandlestickChart({
  timeframe,
  data,
}: PriceCandlestickChartProps) {
  const chartInstanceRef = useRef<EChartsType | null>(null);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataZoomHandlerRef = useRef<DataZoomHandler | null>(null);
  const lastAxisFollowAtRef = useRef(0);

  useEffect(() => {
    return () => {
      const instance = chartInstanceRef.current;
      const handler = dataZoomHandlerRef.current;

      if (instance && handler && !instance.isDisposed()) {
        instance.off("datazoom", handler);
      }

      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }

      chartInstanceRef.current = null;
      dataZoomHandlerRef.current = null;
      scrollEndTimerRef.current = null;
      lastAxisFollowAtRef.current = 0;
    };
  }, []);

  const datasetSource = data.map((point) => [
    point.timestamp,
    point.values[0],
    point.values[1],
    point.values[2],
    point.values[3],
  ]);
  const timestamps = useMemo(
    () => data.map((point) => point.timestamp),
    [data],
  );
  const labelsByTimestamp = useMemo(
    () => new Map(data.map((point) => [point.timestamp, point.label])),
    [data],
  );
  const initialVisibleCount = initialVisibleCounts[timeframe];
  const initialStartIndex = Math.max(0, data.length - initialVisibleCount);
  const firstTimestamp = timestamps[0] ?? 0;
  const lastTimestamp = timestamps[timestamps.length - 1] ?? firstTimestamp;
  const timestampRange = lastTimestamp - firstTimestamp;
  const initialStart =
    timestampRange > 0
      ? ((timestamps[initialStartIndex] - firstTimestamp) / timestampRange) * 100
      : 0;
  const priceRangeIndex = useMemo(() => buildPriceRangeIndex(data), [data]);
  const initialVisibleIndices = getVisibleIndices(
    timestamps,
    initialStart,
    100,
  );
  const initialAxisRange = priceRangeIndex.query(
    initialVisibleIndices.startIndex,
    initialVisibleIndices.endIndex,
  );

  const applyVisibleAxisRange = (
    instance: EChartsType,
    startPercent: number,
    endPercent: number,
    logVisibleData = false,
  ) => {
    if (instance.isDisposed()) {
      return;
    }

    const { startIndex, endIndex } = getVisibleIndices(
      timestamps,
      startPercent,
      endPercent,
    );

    if (logVisibleData) {
      console.log("sliceVisibleData", {
        timeframe,
        startPercent,
        endPercent,
        visibleData: data.slice(startIndex, endIndex + 1),
      });
    }

    const nextAxisRange =
      endIndex >= startIndex
        ? priceRangeIndex.query(startIndex, endIndex)
        : initialAxisRange;

    instance.setOption(
      {
        yAxis: [
          {
            min: nextAxisRange.min,
            max: nextAxisRange.max,
          },
        ],
      },
      { lazyUpdate: true },
    );
  };

  const handleChartReady = (instance: EChartsType) => {
    if (chartInstanceRef.current === instance) {
      return;
    }

    const previousInstance = chartInstanceRef.current;
    const previousHandler = dataZoomHandlerRef.current;

    if (previousInstance && previousHandler && !previousInstance.isDisposed()) {
      previousInstance.off("datazoom", previousHandler);
    }

    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }

    chartInstanceRef.current = instance;
    lastAxisFollowAtRef.current = 0;

    const handleDataZoom: DataZoomHandler = (...args) => {
      if (instance.isDisposed()) {
        return;
      }

      const event = args[0] as DataZoomEvent;
      const horizontalRange = getHorizontalZoomRange(event);
      if (!horizontalRange) {
        return;
      }

      const now = Date.now();
      if (now - lastAxisFollowAtRef.current >= axisFollowIntervalMs) {
        applyVisibleAxisRange(
          instance,
          horizontalRange.startPercent,
          horizontalRange.endPercent,
        );
        lastAxisFollowAtRef.current = now;
      }

      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
      }

      scrollEndTimerRef.current = setTimeout(() => {
        if (!instance.isDisposed()) {
          applyVisibleAxisRange(
            instance,
            horizontalRange.startPercent,
            horizontalRange.endPercent,
            true,
          );
        }
        scrollEndTimerRef.current = null;
      }, scrollEndDelayMs);
    };

    dataZoomHandlerRef.current = handleDataZoom;
    instance.on("datazoom", handleDataZoom);
  };

  const option: EChartsOption = {
    animationDuration: 500,
    backgroundColor: "transparent",
    dataset: {
      dimensions: ["timestamp", "open", "close", "low", "high"],
      source: datasetSource,
    },
    grid: {
      top: 24,
      right: 16,
      bottom: 72,
      left: 16,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderWidth: 0,
      textStyle: {
        color: "#e2e8f0",
      },
      formatter: (params) => {
        const [series] = Array.isArray(params) ? params : [params];
        if (!series || !Array.isArray(series.value)) {
          return "";
        }

        const [timestamp, open, close, low, high] = series.value as [
          number,
          number,
          number,
          number,
          number,
        ];
        const label =
          labelsByTimestamp.get(timestamp) ??
          new Date(timestamp).toLocaleDateString("ja-JP");
        return [
          `<strong>${label}</strong>`,
          `始値: ${formatYen(open)}`,
          `終値: ${formatYen(close)}`,
          `安値: ${formatYen(low)}`,
          `高値: ${formatYen(high)}`,
        ].join("<br/>");
      },
    },
    xAxis: {
      type: "time",
      boundaryGap: ["0%", "0%"],
      axisLine: {
        lineStyle: {
          color: "#94a3b8",
        },
      },
      axisLabel: {
        color: "#64748b",
      },
    },
    yAxis: {
      scale: true,
      min: initialAxisRange.min,
      max: initialAxisRange.max,
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: "#e2e8f0",
        },
      },
      axisLabel: {
        color: "#64748b",
        showMinLabel: false,
        showMaxLabel: false,
        formatter: (value: number) => `¥${Math.round(value / 1000)}k`,
      },
    },
    dataZoom: [
      {
        type: "inside",
        id: xInsideZoomId,
        xAxisIndex: 0,
        filterMode: "none",
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: true,
        preventDefaultMouseMove: false,
        start: initialStart,
        end: 100,
      },
      {
        type: "slider",
        id: xSliderZoomId,
        xAxisIndex: 0,
        filterMode: "filter",
        height: 32,
        bottom: 18,
        borderColor: "#cbd5e1",
        fillerColor: "rgba(37, 99, 235, 0.16)",
        backgroundColor: "rgba(148, 163, 184, 0.12)",
        moveHandleSize: 0,
        handleSize: "100%",
        brushSelect: false,
      },
      {
        type: "inside",
        yAxisIndex: 0,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: true,
        preventDefaultMouseMove: false,
        start: 0,
        end: 100,
      },
      {
        type: "slider",
        yAxisIndex: 0,
        width: 18,
        right: 0,
        top: 24,
        bottom: 72,
        zoomLock: true,
        borderColor: "#cbd5e1",
        fillerColor: "rgba(37, 99, 235, 0.16)",
        backgroundColor: "rgba(148, 163, 184, 0.12)",
      },
    ],
    series: [
      {
        name: timeframeLabels[timeframe],
        id: "price-candles",
        type: "candlestick",
        encode: {
          x: "timestamp",
          y: ["open", "close", "low", "high"],
          tooltip: ["open", "close", "low", "high"],
        },
        itemStyle: {
          color: "#16a34a",
          color0: "#dc2626",
          borderColor: "#16a34a",
          borderColor0: "#dc2626",
        },
        emphasis: {
          itemStyle: {
            borderWidth: 2,
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      onChartReady={handleChartReady}
      style={{ height: 420, width: "100%" }}
    />
  );
}
