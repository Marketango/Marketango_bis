"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
    fill?: boolean;
  }[];
  title?: string;
  yTickFormat?: "currency" | "percent" | "number";
  height?: number;
}

const PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function formatTick(value: number, format?: string): string {
  if (format === "currency") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
    return `$${value}`;
  }
  if (format === "percent") return `${value}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

export default function LineChart({
  labels,
  datasets,
  title,
  yTickFormat,
  height = 250,
}: LineChartProps) {
  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color ?? PALETTE[i % PALETTE.length],
      backgroundColor: ds.fill
        ? `${ds.color ?? PALETTE[i % PALETTE.length]}20`
        : "transparent",
      fill: ds.fill ?? false,
      tension: 0.4,
      pointRadius: labels.length > 30 ? 0 : 3,
      pointHoverRadius: 5,
      borderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
      title: title
        ? { display: true, text: title, font: { size: 13, weight: "600" as const }, padding: { bottom: 12 } }
        : undefined,
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${formatTick(ctx.parsed.y, yTickFormat)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 0, autoSkipPadding: 20 },
      },
      y: {
        grid: { color: "#F3F4F6" },
        ticks: {
          font: { size: 10 },
          callback: (value: number | string) => formatTick(Number(value), yTickFormat),
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
