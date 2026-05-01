// src/components/customchart.tsx
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { samplePriceData } from "./data";

// react-apexcharts は SSR 非対応なので dynamic import 推奨（Next.js の場合）
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const dailySeriesData = samplePriceData.daily.map((d) => ({
  x: d.price_date.getTime(),
  y: parseFloat(d.price),
}));
const lately_date = dailySeriesData[dailySeriesData.length - 1].x;
const diff_days_weekly = lately_date - samplePriceData.weekly[samplePriceData.weekly.length - 1].price_week.getTime();
const diff_days_monthly = lately_date - samplePriceData.monthly[samplePriceData.monthly.length - 1].price_month.getTime();
var weeklySeriesData = samplePriceData.weekly.map((d) => ({
  x: d.price_week.getTime()+diff_days_weekly,
  y: parseFloat(d.price),
}));
var monthlySeriesData = samplePriceData.monthly.map((d) => ({
  x: d.price_month.getTime()+diff_days_monthly,
  y: parseFloat(d.price),
}));
weeklySeriesData[0].x = dailySeriesData[0].x;
monthlySeriesData[0].x = dailySeriesData[0].x;

/** ------- Simple ApexCharts（ミニマル版） ------- */

const simpleOptions: ApexOptions = {
  chart: {
    type: "line",
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    foreColor: "#6b7280",
  },
  stroke: {
    curve: "smooth",
    width: [2, 3, 4],
  },
  colors: ["#3b82f6", "#10b981", "#f59e0b"],
  dataLabels: {
    enabled: false,
  },
  grid: {
    borderColor: "#e5e7eb",
  },
  xaxis: {
    type: "datetime",
    labels: {
      style: {
        colors: "#6b7280",
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: "#6b7280",
      },
    },
  },
  legend: {
    position: "top",
    labels: {
      colors: "#4b5563",
    },
  },
};

const simpleSeries = [
  {
    name: "日次価格",
    data: dailySeriesData,
  },
  {
    name: "週次価格",
    data: weeklySeriesData,
  },
  {
    name: "月次価格",
    data: monthlySeriesData,
  },
];

/** ------- ApexCharts Advanced（ダッシュボード版） ------- */

const advancedOptions: ApexOptions = {
  chart: {
    type: "line",
    foreColor: "#e5e7eb",
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
    },
    zoom: {
      enabled: true,
    },
    animations: {
      enabled: true,
      speed: 600,
    },
  },
  stroke: {
    curve: "smooth",
    width: [2, 4, 5],
  },
  dataLabels: {
    enabled: false,
  },
  colors: ["#38bdf8", "#34d399", "#f59e0b"],
  grid: {
    borderColor: "rgba(148,163,184,0.3)",
    strokeDashArray: 4,
  },
  xaxis: {
    type: "datetime",
    axisBorder: {
      color: "rgba(148,163,184,0.6)",
    },
    axisTicks: {
      color: "rgba(148,163,184,0.6)",
    },
    labels: {
      style: {
        colors: Array(6).fill("#cbd5e1"),
      },
    },
  },
  yaxis: {
    title: {
      text: "価格",
      style: {
        color: "#cbd5e1",
      },
    },
    labels: {
      style: {
        colors: ["#cbd5e1"],
      },
    },
  },
  fill: {
    type: "solid",
    gradient: {
      shade: "dark",
      gradientToColors: ["#60a5fa"],
      shadeIntensity: 0.7,
      opacityFrom: 0.85,
      opacityTo: 0.1,
      stops: [0, 40, 100],
    },
  },
  tooltip: {
    theme: "dark",
    x: {
      show: true,
    },
  },
  legend: {
    position: "top",
    labels: {
      colors: "#e5e7eb",
    },
  },
};

const advancedSeries = [
  {
    name: "日次価格",
    data: dailySeriesData,
  },
  {
    name: "週次価格",
    data: weeklySeriesData,
  },
  {
    name: "月次価格",
    data: monthlySeriesData,
  },
];

export function Customchart() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Simple ApexCharts */}
      <section>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: "#4b5563",
          }}
        >
          Simple ApexCharts（ミニマル設定）
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 12,
          }}
        >
          最低限の設定だけで、実績と目標の 2
          系列ではなく、日足・週足・月足を同じ時間軸に重ねて表示するシンプルなサンプルです。
          「粒度の違う価格推移をざっくり比較したい」用途向けです。
        </p>

        <div
          style={{
            height: 260,
            padding: 12,
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          }}
        >
          <Chart
            type="line"
            options={simpleOptions}
            series={simpleSeries}
            height="100%"
            width="100%"
          />
        </div>
      </section>

      {/* ApexCharts Advanced */}
      <section>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: "#4b5563",
          }}
        >
          ApexCharts Advanced（インタラクティブ & ダッシュボード向け）
        </h2>
        <p
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginBottom: 12,
          }}
        >
          日足・週足・月足を同じ datetime 軸で重ね、ズームやパンを使いながら差分を確認できる
          インタラクティブ版です。
        </p>

        <div
          style={{
            height: 260,
            padding: 14,
            background:
              "linear-gradient(135deg, rgba(17,24,39,1), rgba(2,6,23,1))",
            borderRadius: 18,
            boxShadow: "0 18px 40px rgba(15,23,42,0.55)",
          }}
        >
          <Chart
            type="line"
            options={advancedOptions}
            series={advancedSeries}
            height="100%"
            width="100%"
          />
        </div>
      </section>
    </div>
  );
}
