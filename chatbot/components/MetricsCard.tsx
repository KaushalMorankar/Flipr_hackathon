// File: components/MetricsCard.tsx

import React from "react";

type MetricsCardProps = {
  title: string;
  value: string;
  description: string;
  // ← added accentColor prop (optional)
  accentColor?: "blue" | "green" | "purple" | "gray";
};

export default function MetricsCard({
  title,
  value,
  description,
  accentColor = "gray",
}: MetricsCardProps) {
  // determine Tailwind classes based on accentColor
  const borderClass = {
    blue: "border-blue-500",
    green: "border-green-500",
    purple: "border-purple-500",
    gray: "border-gray-500",
  }[accentColor];

  const textClass = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    gray: "text-gray-800",
  }[accentColor];

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${borderClass}`}>
      <h3 className={`text-lg font-semibold mb-2 ${textClass}`}>{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}
