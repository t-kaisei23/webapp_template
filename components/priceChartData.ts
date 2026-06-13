import type { PriceDailyDatum } from "./data";

export type Timeframe = "day" | "week" | "month";

export type CandlePoint = {
  label: string;
  timestamp: number;
  values: [number, number, number, number];
};

type DailyClosePoint = {
  date: Date;
  close: number;
};

type DailyCandleSeed = {
  date: Date;
  open: number;
  close: number;
  low: number;
  high: number;
};

const formatMonth = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const formatDay = (date: Date) =>
  `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;

const getWeekStart = (date: Date) => {
  const weekStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = weekStart.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setUTCDate(weekStart.getUTCDate() + diff);
  return weekStart;
};

const formatWeek = (date: Date) => {
  const start = getWeekStart(date);
  const month = start.getUTCMonth() + 1;
  const day = start.getUTCDate();
  return `${start.getUTCFullYear()}/${month}/${day}`;
};

const toDailyClosePoints = (data: PriceDailyDatum[]): DailyClosePoint[] =>
  [...data]
    .sort((a, b) => a.price_date.getTime() - b.price_date.getTime())
    .map((entry) => ({
      date: entry.price_date,
      close: Number.parseFloat(entry.price),
    }));

const toDailyCandles = (data: PriceDailyDatum[]): DailyCandleSeed[] => {
  const points = toDailyClosePoints(data);

  return points.map((point, index) => {
    const open = index === 0 ? point.close : points[index - 1].close;
    const close = point.close;

    return {
      date: point.date,
      open,
      close,
      low: Math.min(open, close),
      high: Math.max(open, close),
    };
  });
};

const buildDailySeries = (data: PriceDailyDatum[]): CandlePoint[] =>
  toDailyCandles(data).map((candle) => ({
    label: formatDay(candle.date),
    timestamp: candle.date.getTime(),
    values: [candle.open, candle.close, candle.low, candle.high],
  }));

const buildGroupedSeries = (
  data: PriceDailyDatum[],
  unit: "week" | "month",
): CandlePoint[] => {
  const points = toDailyClosePoints(data);
  const groups = new Map<string, DailyClosePoint[]>();

  for (const point of points) {
    const key =
      unit === "week"
        ? getWeekStart(point.date).toISOString()
        : new Date(
            Date.UTC(point.date.getUTCFullYear(), point.date.getUTCMonth(), 1),
          ).toISOString();
    const existing = groups.get(key);

    if (existing) {
      existing.push(point);
    } else {
      groups.set(key, [point]);
    }
  }

  return [...groups.entries()].map(([key, values]) => {
    const first = values[0];
    const last = values[values.length - 1];
    const open = first.close;
    const close = last.close;
    const low = Math.min(...values.map((value) => value.close));
    const high = Math.max(...values.map((value) => value.close));
    const date = new Date(key);

    return {
      label: unit === "week" ? formatWeek(date) : formatMonth(date),
      timestamp: date.getTime(),
      values: [open, close, low, high],
    };
  });
};

export const buildPriceSeriesByTimeframe = (
  data: PriceDailyDatum[],
): Record<Timeframe, CandlePoint[]> => ({
  day: buildDailySeries(data),
  week: buildGroupedSeries(data, "week"),
  month: buildGroupedSeries(data, "month"),
});
