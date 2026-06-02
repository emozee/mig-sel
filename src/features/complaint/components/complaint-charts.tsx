import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  PieChart,
  Pie,
} from 'recharts';
import {
  Clock,
  CheckCircle2,
  MapPin,
  Loader2,
  Layers,
  Route,
  Trash2,
  Lightbulb,
  Droplets,
  MoreHorizontal,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { useComplaints } from '@/features/complaint/api/use-complaints';
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS } from '@/features/complaint/constants';
import type { ComplaintCategory } from '@/features/complaint/types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#b45309',
  'in-progress': '#2563eb',
  resolved: '#0d9488',
};

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  road: Route,
  garbage: Trash2,
  lighting: Lightbulb,
  drainage: Droplets,
  other: MoreHorizontal,
};

const CategoryIcon = ({
  category,
  className,
  style,
}: {
  category: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const Icon = CATEGORY_ICONS[category] || MoreHorizontal;
  return <Icon className={className} style={style} />;
};

const STATUS_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  pending: Clock,
  'in-progress': MapPin,
  resolved: CheckCircle2,
};

const StatusIcon = ({
  status,
  className,
  style,
}: {
  status: string;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const Icon = STATUS_ICONS[status];
  if (!Icon) return null;
  return <Icon className={className} style={style} />;
};

export const ComplaintCharts = () => {
  const { data: complaints = [], isLoading } = useComplaints();

  const summary = useMemo(
    () => ({
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'pending').length,
      inProgress: complaints.filter((c) => c.status === 'in-progress').length,
      resolved: complaints.filter((c) => c.status === 'resolved').length,
    }),
    [complaints],
  );

  const categoryData = useMemo(() => {
    const catTotals = complaints.reduce<Record<string, number>>((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(catTotals)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        key: key as ComplaintCategory,
        category: CATEGORY_LABELS[key as ComplaintCategory] || key,
        count: value,
        color: CATEGORY_COLORS[key as ComplaintCategory] || '#999',
      }))
      .sort((a, b) => b.count - a.count);
  }, [complaints]);

  const statusData = useMemo(() => {
    const statTotals = complaints.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statTotals)
      .filter(([, value]) => value > 0)
      .map(([statusKey, value]) => ({
        statusKey,
        name: STATUS_LABELS[statusKey as keyof typeof STATUS_LABELS] || statusKey,
        value,
        color: STATUS_COLORS[statusKey] || '#999',
      }));
  }, [complaints]);

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
      {complaints.length === 0 ? (
        <Card className="flex h-80 items-center justify-center">
          <p className="text-muted-foreground text-sm">No complaint data available</p>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-5 gap-4">
            <Card
              size="sm"
              className="!p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Total
                </p>
                <div className="bg-muted group-hover/card:bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200">
                  <Layers className="text-muted-foreground h-5 w-5" />
                </div>
              </div>
              <p className="text-foreground mt-1.5 text-3xl font-bold tabular-nums">
                {summary.total}
              </p>
            </Card>
            <Card
              size="sm"
              className="!p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Pending
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 transition-colors duration-200 group-hover/card:bg-orange-100">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
              </div>
              <p className="text-foreground mt-1.5 text-3xl font-bold tabular-nums">
                {summary.pending}
              </p>
            </Card>
            <Card
              size="sm"
              className="!p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  In Progress
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 transition-colors duration-200 group-hover/card:bg-blue-100">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <p className="text-foreground mt-1.5 text-3xl font-bold tabular-nums">
                {summary.inProgress}
              </p>
            </Card>
            <Card
              size="sm"
              className="!p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Resolved
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 transition-colors duration-200 group-hover/card:bg-green-100">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <p className="text-foreground mt-1.5 text-3xl font-bold tabular-nums">
                {summary.resolved}
              </p>
            </Card>
          </div>

          {/* Unified category analytics card: bar chart (75%) + compact distribution (25%) */}
          <Card className="overflow-hidden">
            <div className="flex">
              {/* Bar chart — 75% */}
              <div className="flex-[3] border-r">
                <div className="flex items-baseline gap-3 px-8 pt-6 pb-1">
                  <p className="text-muted-foreground text-sm font-bold tracking-wide uppercase">
                    Complaints by Category
                  </p>
                  <p className="text-muted-foreground/40 text-[11px] font-medium">
                    Count per category
                  </p>
                </div>
                <div className="px-4">
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart
                      data={categoryData}
                      margin={{ left: 4, right: 24, top: 8, bottom: 32 }}
                      barCategoryGap="25%"
                    >
                      <defs>
                        {categoryData.map((entry) => (
                          <linearGradient
                            key={entry.key}
                            id={`cat-bar-${entry.key}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                            <stop offset="100%" stopColor={entry.color} stopOpacity={0.4} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="hsl(var(--border))"
                        vertical={false}
                        strokeOpacity={0.4}
                      />
                      <XAxis
                        type="category"
                        dataKey="category"
                        tick={{
                          fontSize: 11,
                          fill: 'hsl(var(--muted-foreground))',
                          fontWeight: 500,
                        }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={6}
                      />
                      <YAxis
                        type="number"
                        tick={{
                          fontSize: 11,
                          fill: 'hsl(var(--muted-foreground))',
                          fontWeight: 500,
                        }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        width={28}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover/98 border-border animate-in fade-in-0 zoom-in-95 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm duration-100">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="inline-block h-3 w-3 rounded-full ring-2 ring-white/50"
                                  style={{ backgroundColor: d.color }}
                                />
                                <span className="text-foreground text-sm font-semibold">
                                  {d.category}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-baseline gap-1.5">
                                <span className="text-foreground text-lg font-bold tabular-nums">
                                  {d.count}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  complaint{d.count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                        cursor={{
                          fill: 'hsl(var(--muted-foreground))',
                          fillOpacity: 0.06,
                          radius: 6,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[10, 10, 0, 0]}
                        maxBarSize={96}
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {categoryData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={`url(#cat-bar-${entry.key})`}
                            stroke={entry.color}
                            strokeWidth={0.5}
                          />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="top"
                          style={{
                            fontSize: 12,
                            fill: 'hsl(var(--muted-foreground))',
                            fontWeight: 700,
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribution list — 25% */}
              <div className="min-w-0 flex-[1]">
                <div className="px-4 pt-5 pb-2">
                  <p className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
                    Distribution
                  </p>
                </div>
                <div className="space-y-0.5 px-2 pb-5">
                  {categoryData.map((entry) => {
                    const pct =
                      summary.total > 0 ? ((entry.count / summary.total) * 100).toFixed(0) : '0';
                    return (
                      <div
                        key={entry.key}
                        className="group flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-150 hover:scale-[1.02] hover:shadow-xs"
                        style={{ backgroundColor: `${entry.color}08` }}
                      >
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110"
                          style={{ backgroundColor: `${entry.color}18` }}
                        >
                          <CategoryIcon
                            category={entry.key}
                            className="h-3.5 w-3.5"
                            style={{ color: entry.color }}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                          <span className="text-foreground truncate text-xs font-semibold">
                            {entry.category}
                          </span>
                          <span
                            className="shrink-0 text-[11px] font-bold tabular-nums"
                            style={{ color: entry.color }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Unified status analytics card: pie chart (75%) + compact distribution (25%) */}
          {statusData.length > 0 && (
            <Card className="overflow-hidden">
              <div className="flex">
                {/* Pie chart — 75% */}
                <div className="flex-[3] border-r">
                  <div className="flex items-center justify-between px-8 pt-6 pb-1">
                    <p className="text-muted-foreground text-sm font-bold tracking-wide uppercase">
                      Complaints by Status
                    </p>
                  </div>
                  <div className="px-4">
                    <ResponsiveContainer width="100%" height={380}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={85}
                          outerRadius={135}
                          paddingAngle={4}
                          dataKey="value"
                          cornerRadius={8}
                          stroke="hsl(var(--background))"
                          strokeWidth={3}
                          label={({ name, percent }) =>
                            `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          labelLine={{
                            stroke: 'hsl(var(--muted-foreground))',
                            strokeWidth: 1.5,
                            strokeDasharray: '3 2',
                          }}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const d = payload[0].payload;
                            return (
                              <div className="bg-popover/98 border-border animate-in fade-in-0 zoom-in-95 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm duration-100">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="inline-block h-3 w-3 rounded-full ring-2 ring-white/50"
                                    style={{ backgroundColor: d.color }}
                                  />
                                  <span className="text-foreground text-sm font-semibold">
                                    {d.name}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex items-baseline gap-1.5">
                                  <span className="text-foreground text-lg font-bold tabular-nums">
                                    {d.value}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    complaint{d.value !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distribution list — 25% */}
                <div className="min-w-0 flex-[1]">
                  <div className="px-4 pt-5 pb-2">
                    <p className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
                      Distribution
                    </p>
                  </div>
                  <div className="space-y-0.5 px-2 pb-5">
                    {statusData.map((entry) => {
                      const pct =
                        summary.total > 0 ? ((entry.value / summary.total) * 100).toFixed(0) : '0';
                      return (
                        <div
                          key={entry.statusKey}
                          className="group flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-150 hover:scale-[1.02] hover:shadow-xs"
                          style={{ backgroundColor: `${entry.color}08` }}
                        >
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-110"
                            style={{ backgroundColor: `${entry.color}18` }}
                          >
                            <StatusIcon
                              status={entry.statusKey}
                              className="h-3.5 w-3.5"
                              style={{ color: entry.color }}
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 items-center justify-between gap-1">
                            <span className="text-foreground truncate text-xs font-semibold">
                              {entry.name}
                            </span>
                            <span
                              className="shrink-0 text-[11px] font-bold tabular-nums"
                              style={{ color: entry.color }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
