export type ChartDatum = {
  month: string;
  actual: number; // 実績
  target: number; // 目標
};

export const chartData: ChartDatum[] = [
  { month: "Jan", actual: 120, target: 150 },
  { month: "Feb", actual: 210, target: 200 },
  { month: "Mar", actual: 160, target: 220 },
  { month: "Apr", actual: 280, target: 250 },
  { month: "May", actual: 300, target: 260 },
];
