"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
  title?: string;
  yTickFormat?: "currency" | "percent" | "number";
  horizontal?: boolean;
  stacked?: boolean;
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

export default function BarChart({
  labels,
  datasets,
  title,
  yTickFormat,
  horizontal = false,
  stacked = false,
  height = 250,
}: BarChartProps) {
  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: `${ds.color ?? PALETTE[i % PALETTE.length]}CC`,
      borderColor: ds.color ?? PALETTE[i % PALETTE.length],
      borderWidth: 1,
      borderRadius: 4,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: (horizontal ? "y" : "x") as "x" | "y",
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
          label: (ctx: { dataset: { label: string }; parsed: { x: number; y: number } }) => {
            const v = horizontal ? ctx.parsed.x : ctx.parsed.y;
            return `${ctx.dataset.label}: ${formatTick(v, yTickFormat)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked,
        grid: horizontal ? { color: "#F3F4F6" } : { display: false },
        ticks: {
          font: { size: 10 },
          callback: horizontal
            ? (value: number | string) => formatTick(Number(value), yTickFormat)
            : undefined,
          maxRotation: 0,
          autoSkipPadding: 12,
        },
      },
      y: {
        stacked,
        grid: horizontal ? { display: false } : { color: "#F3F4F6" },
        ticks: {
          font: { size: 10 },
          callback: !horizontal
            ? (value: number | string) => formatTick(Number(value), yTickFormat)
            : undefined,
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
