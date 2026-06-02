import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWasteRecords } from '@/features/waste/api/use-waste-records';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/features/waste/constants';
import type { WasteCategory } from '@/features/waste/types';
import type { WasteRecord } from '@/features/waste/types';

type Period = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const YEARS = Array.from({ length: 14 }, (_, i) => 2026 + i);

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const QUARTER_LABELS = ['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'];

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeeksInMonth(year: number, month: number): number[] {
  const weeks = new Set<number>();
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    weeks.add(getISOWeekNumber(new Date(year, month, day)));
  }
  return Array.from(weeks).sort((a, b) => a - b);
}

function getWeekRange(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);
  const monday = new Date(mondayOfWeek1);
  monday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getQuarterRange(year: number, quarter: number): { start: Date; end: Date } {
  const start = new Date(year, quarter * 3, 1);
  const end = new Date(year, quarter * 3 + 3, 0, 23, 59, 59, 999);
  return { start, end };
}

type BarItem = {
  category: string;
  quantity: number;
  color: string;
  pct: string;
  unit: string;
};

function buildBarDataForRange(records: WasteRecord[], start: Date, end: Date): BarItem[] {
  const filtered = records.filter((r) => {
    const d = new Date(r.reportedAt);
    return d >= start && d <= end;
  });

  if (filtered.length === 0) return [];

  const normalized = filtered.map((r) => ({
    ...r,
    quantity: r.unit === 'ton' ? r.quantity * 1000 : r.quantity,
  }));

  const total = normalized.reduce((sum, r) => sum + r.quantity, 0);
  const grouped = normalized.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.quantity;
    return acc;
  }, {});

  return Object.entries(grouped)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      category: CATEGORY_LABELS[key as WasteCategory] || key,
      quantity: Number(value.toFixed(1)),
      color: CATEGORY_COLORS[key as WasteCategory] || '#999',
      pct: ((value / total) * 100).toFixed(1),
      unit: 'kg',
    }))
    .sort((a, b) => b.quantity - a.quantity);
}

const PERIODS: Period[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

const PERIOD_LABELS: Record<Period, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const CARD_ACCENT: Record<Period, string> = {
  weekly: '',
  monthly: '',
  quarterly: '',
  yearly: '',
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: BarItem }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-popover/95 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="text-foreground text-sm font-semibold">{d.category}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">
        <span className="text-foreground font-bold">{d.quantity}</span> {d.unit}
        <span className="text-muted-foreground ml-2">({d.pct}%)</span>
      </p>
    </div>
  );
}

function wrapLabel(label: string, maxChars: number): string[] {
  const lines: string[] = [];
  let remaining = label;
  while (remaining.length > maxChars) {
    const breakAt = remaining.lastIndexOf(' ', maxChars);
    const breakAtAlt = remaining.lastIndexOf('/', maxChars);
    const breakAtAmp = remaining.lastIndexOf('&', maxChars);
    const bestBreak = Math.max(breakAt, breakAtAlt, breakAtAmp);
    if (bestBreak <= 0) {
      lines.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars);
    } else {
      lines.push(remaining.slice(0, bestBreak));
      remaining = remaining.slice(bestBreak + 1);
    }
  }
  if (remaining) lines.push(remaining);
  return lines;
}

function CustomXAxisTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  if (!payload) return null;
  const lines = wrapLabel(payload.value, 11);
  return (
    <text
      x={x}
      y={(y ?? 0) + 4}
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
      fontWeight={500}
      textAnchor="middle"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function WasteBarChart({
  data,
  title,
  controls,
  className,
}: {
  data: BarItem[];
  title: string;
  controls?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        'group overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg',
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-foreground text-base font-semibold">{title}</CardTitle>
          {controls}
        </div>
      </CardHeader>
      {data.length === 0 ? (
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground/50 text-sm">No data for {title.toLowerCase()}</p>
          </div>
        </CardContent>
      ) : (
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data}
              margin={{ left: 0, right: 16, top: 12, bottom: 100 }}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="hsl(var(--border))"
                vertical={false}
                strokeOpacity={0.5}
              />
              <XAxis
                type="category"
                dataKey="category"
                tick={<CustomXAxisTick />}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                interval={0}
                height={100}
              />
              <YAxis
                type="number"
                tick={{
                  fontSize: 12,
                  fill: 'hsl(var(--muted-foreground))',
                  fontWeight: 600,
                }}
                axisLine={false}
                tickLine={false}
                width={80}
                unit=" kg"
                tickFormatter={(v: number) => Intl.NumberFormat('en-US').format(v)}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.06, radius: 6 }}
              />
              <Bar
                dataKey="quantity"
                radius={[8, 8, 0, 0]}
                maxBarSize={100}
                animationBegin={0}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      )}
    </Card>
  );
}

export const WasteCharts = () => {
  const { data: records = [], isLoading } = useWasteRecords();

  const now = new Date();
  const initialYear = Math.min(2039, Math.max(2026, now.getFullYear()));
  const [selectedYear, setSelectedYear] = useState<string>(String(initialYear));
  const [selectedWeek, setSelectedWeek] = useState<number>(getISOWeekNumber(now));
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(now.getMonth() / 3));
  const [weeklyMonth, setWeeklyMonth] = useState<number>(now.getMonth());

  const yearFilteredRecords = useMemo(
    () => records.filter((r) => new Date(r.reportedAt).getFullYear() === Number(selectedYear)),
    [records, selectedYear],
  );

  const weeksInWeeklyMonth = useMemo(
    () => getWeeksInMonth(Number(selectedYear), weeklyMonth),
    [selectedYear, weeklyMonth],
  );

  const periodDataWeekly = useMemo(() => {
    const wRange = getWeekRange(Number(selectedYear), selectedWeek);
    return buildBarDataForRange(yearFilteredRecords, wRange.start, wRange.end);
  }, [yearFilteredRecords, selectedYear, selectedWeek]);

  const periodDataMonthly = useMemo(() => {
    const mRange = getMonthRange(Number(selectedYear), selectedMonth);
    return buildBarDataForRange(yearFilteredRecords, mRange.start, mRange.end);
  }, [yearFilteredRecords, selectedYear, selectedMonth]);

  const periodDataQuarterly = useMemo(() => {
    const qRange = getQuarterRange(Number(selectedYear), selectedQuarter);
    return buildBarDataForRange(yearFilteredRecords, qRange.start, qRange.end);
  }, [yearFilteredRecords, selectedYear, selectedQuarter]);

  const yRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return { start, end };
  }, []);

  const periodDataYearly = useMemo(() => {
    return buildBarDataForRange(yearFilteredRecords, yRange.start, yRange.end);
  }, [yearFilteredRecords, yRange]);

  const periodData: Record<Period, BarItem[]> = {
    weekly: periodDataWeekly,
    monthly: periodDataMonthly,
    quarterly: periodDataQuarterly,
    yearly: periodDataYearly,
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-foreground text-lg font-semibold">Waste Management</h2>
          <p className="text-muted-foreground text-sm">
            Waste quantity by category across different periods
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-muted-foreground text-sm whitespace-nowrap">
            Year
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedWeek(getWeeksInMonth(Number(e.target.value), selectedMonth)[0]);
            }}
            className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 h-9 rounded-lg border px-3 text-sm outline-none focus:ring-2"
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {PERIODS.map((p) => {
          let controls: React.ReactNode = null;
          if (p === 'weekly') {
            controls = (
              <div className="flex items-center gap-2">
                <select
                  value={weeklyMonth}
                  onChange={(e) => {
                    setWeeklyMonth(Number(e.target.value));
                    setSelectedWeek(
                      getWeeksInMonth(Number(selectedYear), Number(e.target.value))[0],
                    );
                  }}
                  className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 h-8 rounded-md border px-2 text-sm outline-none focus:ring-2"
                >
                  {MONTH_LABELS.map((label, i) => (
                    <option key={i} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 h-8 rounded-md border px-2 text-sm outline-none focus:ring-2"
                >
                  {weeksInWeeklyMonth.map((w, i) => (
                    <option key={w} value={w}>
                      Week {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            );
          } else if (p === 'monthly') {
            controls = (
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setSelectedWeek(getWeeksInMonth(Number(selectedYear), Number(e.target.value))[0]);
                }}
                className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 h-8 rounded-md border px-2 text-sm outline-none focus:ring-2"
              >
                {MONTH_LABELS.map((label, i) => (
                  <option key={i} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            );
          } else if (p === 'quarterly') {
            controls = (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="border-input bg-background text-foreground focus:border-ring focus:ring-ring/30 h-8 rounded-md border px-2 text-sm outline-none focus:ring-2"
              >
                {QUARTER_LABELS.map((label, i) => (
                  <option key={i} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            );
          }
          return (
            <WasteBarChart
              key={p}
              data={periodData[p]}
              title={PERIOD_LABELS[p]}
              controls={controls}
              className={CARD_ACCENT[p]}
            />
          );
        })}
      </div>
    </div>
  );
};
