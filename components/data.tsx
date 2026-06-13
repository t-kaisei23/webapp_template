
export type PriceDailyDatum = {
  model_id: string;
  website_id: string;
  price_date: Date;
  price: string;
};

export type PriceData = {
  daily: PriceDailyDatum[];
};

const formatPrice = (value: number) => value.toFixed(2);

const createSeededRandom = (seed: number) => {
  let current = seed;

  return () => {
    current = (current * 1664525 + 1013904223) % 4294967296;
    return current / 4294967296;
  };
};

const makeDate = (base: string, offsetDays: number) => {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
};

const buildDailyData = (start: string, days: number) => {
  const random = createSeededRandom(42);
  let price = 100000;

  return Array.from({ length: days }, (_, index) => {
    if (index > 0) {
      const changeRate = random() * 0.2 - 0.1;
      price = Math.max(1000, price * (1 + changeRate));
    }

    return {
      model_id: "1",
      website_id: "1",
      price_date: makeDate(start, index),
      price: formatPrice(price),
    };
  });
};

export const samplePriceData: PriceData = {
  daily: buildDailyData("2024-01-01T00:00:00.000Z", 730),
};
