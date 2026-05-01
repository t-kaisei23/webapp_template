

export type priceweeklydatum =
  | {
      model_id: string;
      website_id: string;
      price_week: Date;
      price: string;
    }
export type pricedailydatum =
  | {
      model_id: string;
      website_id: string;
      price_date: Date;
      price: string;
    }
export type pricemonthlydatum =
  | {
      model_id: string;
      website_id: string;
      price_month: Date;
      price: string;
    };

export type priceData = {
  weekly: priceweeklydatum[];
  daily: pricedailydatum[];
  monthly: pricemonthlydatum[];
};

const formatPrice = (value: number) => value.toFixed(2);
const makeDate = (base: string, offsetDays: number) => {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
};

const buildDailyData = (start: string, days: number) =>
  Array.from({ length: days }, (_, index) => {
    const basePrice = 100000 + ((index * 1800) % 100000);
    const variation = ((index % 7) - 3) * 1200;
    const price = Math.max(100000, Math.min(200000, basePrice + variation));

    return {
      model_id: "1",
      website_id: "1",
      price_date: makeDate(start, index),
      price: formatPrice(price),
    };
  });

const buildWeeklyData = (start: string, weeks: number) =>
  Array.from({ length: weeks }, (_, index) => {
    const basePrice = 110000 + ((index * 7000) % 90000);
    const variation = ((index % 4) - 2) * 3500;
    const price = Math.max(100000, Math.min(200000, basePrice + variation));

    return {
      model_id: "1",
      website_id: "1",
      price_week: makeDate(start, index * 7),
      price: formatPrice(price),
    };
  });

const buildMonthlyData = () => [
  {
    model_id: "1",
    website_id: "1",
    price_month: makeDate("2026-02-01T00:00:00.000Z", 0),
    price: formatPrice(128000),
  },
  {
    model_id: "1",
    website_id: "1",
    price_month: makeDate("2026-03-01T00:00:00.000Z", 0),
    price: formatPrice(156500),
  },
  {
    model_id: "1",
    website_id: "1",
    price_month: makeDate("2026-04-01T00:00:00.000Z", 0),
    price: formatPrice(176200),
  },
];

export const samplePriceData: priceData = {
  weekly: buildWeeklyData("2026-02-01T00:00:00.000Z", 13),
  daily: buildDailyData("2026-02-01T00:00:00.000Z", 89),
  monthly: buildMonthlyData(),
};
