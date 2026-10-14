"use client";

import type { DistributionDto } from "@salary/shared";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toChartBands } from "./chart-bands";

export function DistributionChart({ distribution }: { distribution: DistributionDto }) {
  const data = toChartBands(distribution);
  return (
    <div className="h-[340px] w-full" role="img" aria-label="Histogram of employees per salary band">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#556274" }} interval={0} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#556274" }} tickLine={false} axisLine={false} width={36} />
          <Tooltip
            cursor={{ fill: "#F1F5F9" }}
            formatter={(value: number) => [`${value} employees`, ""]}
            labelFormatter={(_label, payload) => payload?.[0]?.payload?.range ?? ""}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false} label={{ position: "top", fontSize: 12, fill: "#334155" }}>
            {data.map((band) => (
              <Cell key={band.label} fill="#0F766E" fillOpacity={band.hasMedian ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
