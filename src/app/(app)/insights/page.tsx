"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    Battery,
    Droplets,
    Dumbbell,
    Moon,
    TrendingUp,
    Utensils,
} from "lucide-react";
import {
    Card,
    Chip,
    EmptyState,
    PageHeader,
    PageTransition,
    QueryError,
    SkeletonCard,
} from "@/components/ui";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal.store";
import type { WeeklyInsightsResponse } from "@/app/api/insights/weekly/route";

function formatDate(dateStr: string) {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayLabel(dateStr: string) {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", { weekday: "short" });
}

/* ─── Mini Chart Components ─── */
function BarChart({ data, max, color = "bg-clay" }: { data: number[]; max: number; color?: string }) {
    return (
        <div className="flex items-end gap-1 h-20">
            {data.map((value, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: max > 0 ? `${(value / max) * 100}%` : "0%" }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className={cn("flex-1 rounded-t-sm min-h-[2px]", value > 0 ? color : "bg-shell")}
                />
            ))}
        </div>
    );
}

function LineChart({ data, max, color = "#B8704F" }: { data: (number | null)[]; max: number; color?: string }) {
    const width = 100;
    const height = 40;
    const points = data.map((v, i) => ({
        x: (i / (data.length - 1)) * width,
        y: v !== null && max > 0 ? height - (v / max) * height : null,
    }));

    const pathParts: string[] = [];
    let started = false;
    for (const p of points) {
        if (p.y === null) { started = false; continue; }
        if (!started) { pathParts.push(`M ${p.x} ${p.y}`); started = true; }
        else { pathParts.push(`L ${p.x} ${p.y}`); }
    }

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-12" preserveAspectRatio="none">
            <path d={pathParts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => p.y !== null ? (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={color} />
            ) : null)}
        </svg>
    );
}

function StatCard({ icon: Icon, label, value, sub, tone = "clay" }: {
    icon: typeof Activity;
    label: string;
    value: string;
    sub?: string;
    tone?: "clay" | "sage" | "amber" | "blush";
}) {
    const toneMap = {
        clay: "bg-claySoft/30 text-clay",
        sage: "bg-sageSoft/30 text-sage",
        amber: "bg-amber/10 text-amber",
        blush: "bg-blush/20 text-blush",
    };
    return (
        <motion.div variants={fadeUp} className="rounded-2xl border border-hairline bg-card p-4">
            <div className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3", toneMap[tone])}>
                <Icon className="w-4 h-4" />
            </div>
            <p className="font-display text-2xl text-ink">{value}</p>
            <p className="text-xs text-muted mt-0.5">{label}</p>
            {sub && <p className="text-[10px] text-muted/70 mt-1">{sub}</p>}
        </motion.div>
    );
}

/* ─── Main Page ─── */
export default function WeeklyInsightsPage() {
    const [data, setData] = useState<WeeklyInsightsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [guest, setGuest] = useState(false);
    const [weekOffset, setWeekOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const openModal = useAuthModalStore((state) => state.openModal);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/insights/weekly?offset=${weekOffset}`)
            .then((res) => {
                if (res.status === 401) { setGuest(true); return null; }
                if (!res.ok) throw new Error("Unable to load weekly insights.");
                return res.json() as Promise<WeeklyInsightsResponse>;
            })
            .then((payload) => { if (payload) setData(payload); })
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error loading data."))
            .finally(() => setLoading(false));
    }, [weekOffset]);

    const weekLabel = data
        ? `${formatDate(data.week.start)} – ${formatDate(data.week.end)}`
        : "Loading...";

    return (
        <PageTransition>
            <div className="space-y-6">
                <PageHeader
                    eyebrow="weekly insights"
                    title="This Week"
                    subtitle="Your wellness patterns over the past 7 days."
                    action={
                        <Link href="/app/insights/monthly" className="text-sm text-clay hover:text-ink transition-colors">
                            View monthly →
                        </Link>
                    }
                />

                {/* Week navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setWeekOffset((o) => o + 1)}
                        className="flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Previous week
                    </button>
                    <span className="font-mono text-xs text-muted uppercase tracking-wider">{weekLabel}</span>
                    <button
                        onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
                        disabled={weekOffset === 0}
                        className="flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors disabled:opacity-30"
                    >
                        Next week <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {guest && (
                    <Card className="min-h-48">
                        <EmptyState
                            icon={<TrendingUp className="size-8" />}
                            title="Sign in to see your weekly insights"
                            body="Track your patterns over time with weekly analytics."
                            action={{ label: "Sign in", onClick: () => openModal("login") }}
                        />
                    </Card>
                )}

                {error && <QueryError error={new Error(error)} retry={() => window.location.reload()} />}

                {loading && !data && !guest && (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                        {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {data && (
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                        {/* Summary stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard
                                icon={Battery}
                                label="Avg Energy"
                                value={data.summary.avgEnergy !== null ? `${data.summary.avgEnergy}/10` : "—"}
                                tone="amber"
                            />
                            <StatCard
                                icon={Utensils}
                                label="Avg Calories"
                                value={data.summary.avgCalories > 0 ? `${data.summary.avgCalories}` : "—"}
                                sub={data.summary.totalCalories > 0 ? `${data.summary.totalCalories} total` : undefined}
                                tone="clay"
                            />
                            <StatCard
                                icon={Dumbbell}
                                label="Workouts"
                                value={`${data.summary.workoutsCompleted}/${data.summary.workoutsPlanned || "—"}`}
                                sub="completed this week"
                                tone="sage"
                            />
                            <StatCard
                                icon={Moon}
                                label="Avg Sleep"
                                value={data.summary.avgSleep !== null ? `${data.summary.avgSleep}h` : "—"}
                                tone="blush"
                            />
                        </div>

                        {/* Energy trend */}
                        <motion.div variants={fadeUp}>
                            <Card className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-amber" />
                                        <h3 className="text-sm font-medium text-ink">Energy Levels</h3>
                                    </div>
                                    {data.summary.avgEnergy !== null && (
                                        <Chip tone="clay">avg {data.summary.avgEnergy}</Chip>
                                    )}
                                </div>
                                <LineChart
                                    data={data.energy.map((e) => e.score)}
                                    max={10}
                                    color="#C99356"
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-muted">
                                    {data.energy.map((e) => <span key={e.date}>{dayLabel(e.date)}</span>)}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Nutrition bars */}
                        <motion.div variants={fadeUp}>
                            <Card className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Utensils className="w-4 h-4 text-clay" />
                                        <h3 className="text-sm font-medium text-ink">Daily Calories</h3>
                                    </div>
                                    <span className="text-xs text-muted">{data.summary.avgCalories > 0 ? `avg ${data.summary.avgCalories} kcal` : "no data"}</span>
                                </div>
                                <BarChart
                                    data={data.nutrition.map((n) => n.calories)}
                                    max={Math.max(...data.nutrition.map((n) => n.calories), 1)}
                                    color="bg-clay"
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-muted">
                                    {data.nutrition.map((n) => <span key={n.date}>{dayLabel(n.date)}</span>)}
                                </div>
                            </Card>
                        </motion.div>

                        {/* Water + Workouts row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div variants={fadeUp}>
                                <Card className="p-5 h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Droplets className="w-4 h-4 text-sage" />
                                        <h3 className="text-sm font-medium text-ink">Hydration</h3>
                                    </div>
                                    <BarChart
                                        data={data.water.map((w) => w.ml)}
                                        max={Math.max(...data.water.map((w) => w.ml), 1)}
                                        color="bg-sage"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] text-muted">
                                        {data.water.map((w) => <span key={w.date}>{dayLabel(w.date)}</span>)}
                                    </div>
                                    {data.summary.avgWater > 0 && (
                                        <p className="text-xs text-muted mt-3">Avg: {data.summary.avgWater >= 1000 ? `${(data.summary.avgWater / 1000).toFixed(1)}L` : `${data.summary.avgWater}ml`}/day</p>
                                    )}
                                </Card>
                            </motion.div>

                            <motion.div variants={fadeUp}>
                                <Card className="p-5 h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Dumbbell className="w-4 h-4 text-sage" />
                                        <h3 className="text-sm font-medium text-ink">Workouts</h3>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {data.workouts.map((w) => (
                                            <div key={w.date} className="text-center">
                                                <div className={cn(
                                                    "w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-medium",
                                                    w.completed ? "bg-sageSoft/50 text-sage" : "bg-shell/50 text-muted"
                                                )}>
                                                    {w.completed ? "✓" : "—"}
                                                </div>
                                                <p className="text-[9px] text-muted mt-1">{dayLabel(w.date)}</p>
                                                {w.name && <p className="text-[8px] text-muted/70 truncate">{w.name}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Sleep trend */}
                        <motion.div variants={fadeUp}>
                            <Card className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Moon className="w-4 h-4 text-blush" />
                                    <h3 className="text-sm font-medium text-ink">Sleep</h3>
                                </div>
                                <LineChart
                                    data={data.sleep.map((s) => s.hours)}
                                    max={Math.max(...data.sleep.map((s) => s.hours ?? 0), 10)}
                                    color="#E8B4A8"
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-muted">
                                    {data.sleep.map((s) => <span key={s.date}>{dayLabel(s.date)}</span>)}
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </PageTransition>
    );
}
