import React from 'react';

const PALETTE = [
  '#2563eb', '#0891b2', '#0d9488', '#16a34a', '#ca8a04',
  '#ea580c', '#e11d48', '#9333ea', '#4f46e5', '#475569'
];

export const DepartmentPieChart = ({ data = [] }) => {
  const filtered = data.filter(d => d.count > 0);
  const total = filtered.reduce((acc, d) => acc + d.count, 0);

  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>No departmental complaint data recorded yet</p>
      </div>
    );
  }

  // Generate SVG arcs for Donut Chart
  let cumulativeAngle = 0;
  const radius = 70;
  const strokeWidth = 32;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  const slices = filtered.map((item, idx) => {
    const fraction = item.count / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      name: item.department,
      count: item.count,
      percent: Math.round(fraction * 100),
      color: PALETTE[idx % PALETTE.length],
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
      {/* SVG Donut */}
      <div className="relative w-48 h-48 shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              className="transition-all duration-500 hover:opacity-85"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Complaints</span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs w-full max-w-xs">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-slate-50">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
              <span className="text-slate-700 truncate font-medium">{slice.name}</span>
            </div>
            <span className="font-semibold text-slate-900 font-mono shrink-0">
              {slice.count} <span className="text-slate-400 font-normal">({slice.percent}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MonthlyTrendsChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>No area trends available yet</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.count), 5);

  return (
    <div className="w-full">
      <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
        {data.map((item, idx) => {
          const heightPercent = Math.max(10, Math.round((item.count / maxVal) * 100));
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              <div className="text-xs font-semibold text-slate-700 opacity-0 group-hover:opacity-100 transition">
                {item.count}
              </div>
              <div
                className="w-full max-w-[42px] bg-blue-600 rounded-t group-hover:bg-blue-700 transition-all duration-300"
                style={{ height: `${heightPercent}%` }}
              />
              <span className="text-[11px] text-slate-600 truncate max-w-[70px] text-center font-medium block">
                {item.area}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-2">
        <span>Current Reporting Cycle</span>
        <span className="font-medium text-slate-700">Civic Volume by District</span>
      </div>
    </div>
  );
};
