// src/components/ApexExample.tsx
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { chartData } from "./sampledata";

// react-apexcharts は SSR 非対応なので dynamic import 推奨（Next.js の場合）
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const categories = chartData.map((d) => d.month);
const actualValues = chartData.map((d) => d.actual);
const targetValues = chartData.map((d) => d.target);

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
    width: 3,
  },
  colors: ["#3b82f6", "#9ca3af"],
  dataLabels: {
    enabled: false,
  },
  grid: {
    borderColor: "#e5e7eb",
  },
  xaxis: {
    categories,
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
    name: "実績",
    data: actualValues,
  },
  {
    name: "目標",
    data: targetValues,
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
    width: [0, 3], // column は 0, line は 3
  },
  dataLabels: {
    enabled: false,
  },
  colors: ["#3b82f6", "#f97316"],
  grid: {
    borderColor: "rgba(148,163,184,0.3)",
    strokeDashArray: 4,
  },
  xaxis: {
    categories,
    axisBorder: {
      color: "rgba(148,163,184,0.6)",
    },
    axisTicks: {
      color: "rgba(148,163,184,0.6)",
    },
    labels: {
      style: {
        colors: Array(categories.length).fill("#cbd5e1"),
      },
    },
  },
  yaxis: [
    {
      title: {
        text: "実績",
        style: {
          color: "#93c5fd",
        },
      },
      labels: {
        style: {
          colors: "#93c5fd",
        },
      },
    },
    {
      opposite: true,
      title: {
        text: "目標",
        style: {
          color: "#fed7aa",
        },
      },
      labels: {
        style: {
          colors: "#fed7aa",
        },
      },
    },
  ],
  fill: {
    type: "gradient",
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
    name: "実績（Column）",
    type: "column" as const,
    data: actualValues,
  },
  {
    name: "目標（Line）",
    type: "line" as const,
    data: targetValues,
  },
];

export function ApexExample() {
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
          系列を滑らかな折れ線として表示するシンプルなサンプルです。
          「とりあえず値を見たい」用途向けです。
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
          実績をカラム（棒）、目標をラインで重ね、複数 Y 軸・ツールバー・グラデーション塗り
          など ApexCharts の「インタラクティブなダッシュボード表現」を詰め込んだ例です。
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
