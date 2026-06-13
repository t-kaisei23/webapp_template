"use client";

import { useState } from "react";
import { PriceCandlestickChart } from "./PriceCandlestickChart";
import { samplePriceData } from "./data";
import {
  buildPriceSeriesByTimeframe,
  type Timeframe,
} from "./priceChartData";

const timeframeLabels: Record<Timeframe, string> = {
  day: "日足",
  week: "週足",
  month: "月足",
};

const priceSeries = buildPriceSeriesByTimeframe(samplePriceData.daily);

export function Customchart() {
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const activeData = priceSeries[timeframe];

  return (
    <section
      style={{
        width: "100%",
        display: "grid",
        gap: 20,
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          価格チャート
        </h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "#475569",
          }}
        >
          元データは日次のみです。日足は前日終値を始値、当日値を終値としてヒゲなしで描画し、
          週足・月足は日次データから集計したローソク足に切り替えています。
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {(["day", "week", "month"] as Timeframe[]).map((key) => {
          const isActive = timeframe === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setTimeframe(key)}
              style={{
                border: "none",
                borderRadius: 9999,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                color: isActive ? "#eff6ff" : "#334155",
                background: isActive ? "#2563eb" : "#e2e8f0",
                boxShadow: isActive
                  ? "0 10px 24px rgba(37, 99, 235, 0.28)"
                  : "none",
              }}
            >
              {timeframeLabels[key]}
            </button>
          );
        })}
      </div>

      <div
        style={{
          padding: 18,
          borderRadius: 24,
          background:
            "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
          boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {timeframeLabels[timeframe]}
            </h2>
            <p
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              表示本数: {activeData.length}
            </p>
          </div>
        </div>

        <PriceCandlestickChart timeframe={timeframe} data={activeData} />
      </div>
    </section>
  );
}
