"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    Battery,
    Calendar,
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
import type { MonthlyInsightsResponse } from "@/app/api/insights/monthly/route";

/* ─── Chart Components ─── */
function WeeklyBarGroup({ weeks, field, color, label }: {
    weeks: MonthlyInsightsResponse["weeks"];
    field: "avgEnergy" | "avgCalories" | "workoutsCompleted" | "avgWater" | "avgSleep";
    color: string;
    label: string;
}) {
    const values = weeks.map((w) => {
        const v = w[field];
        return v ?? 0;
    });
    const max = Math.max(...values, 1);

    return (
        <div>
            <p className="text-xs text-muted mb-2">{label}</p>
            <div className="flex items-end gap-2 h-16">
                {values.map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: max > 0 ? `${(v / max) * 100}%` : "0%" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={cn("w-full rounded-t-sm min-h-[2px]", v > 0 ? color : "bg-shell")}
                        />
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mt-1">
                {weeks.map((w, i) => (
                    <span key={i} className="flex-1 text-center text-[9px] text-muted">{w.label}</span>
                ))}
            </div>
        </div>
    );
}

function EnergyHeatmap({ daily }: { daily: { date: string; score: number | null }[] }) {
    return (
        <div className="grid grid-cols-7 gap-1">
            {daily.map((d) => {
                const intensity = d.score !== null ? d.score / 10 : 0;
                const day = new Date(`${d.date}T00:00:00`).getDate();
                return (
                    <div
                        key={d.date}
                        className="aspect-square rounded-sm flex items-center justify-center text-[8px]"
                        style={{
                            backgroundColor: d.score !== null
                                ? `rgba(184, 112, 79, ${0.1 + intensity * 0.7})`
                                : "rgba(239, 231, 218, 0.5)",
                        }}
                        title={`${d.date}: ${d.score ?? "no data"}`}
                    >
                        <span className={cn("font-mono", d.score !== null ? "text-ink/70" : "text-muted/40")}>{day}</span>
                    </div>
                );
            })}
        </div>
    );
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="text-center p-3 rounded-xl bg-cream/50">
            <p className="font-display text-xl text-ink">{value}</p>
            <p className="text-[10px] text-muted mt-0.5">{label}</p>
            {sub && <p className="text-[9px] text-muted/60 mt-0.5">{sub}</p>}
        </div>
    );
}

/* ─── Main Page ─── */
export default function MonthlyInsightsPage() {
    const [data, setData] = useState<MonthlyInsightsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [guest, setGuest] = useState(false);
    const [monthOffset, setMonthOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const openModal = useAuthModalStore((state) => state.openModal);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/insights/monthly?offset=${monthOffset}`)
            .then((res) => {
                if (res.status === 401) { setGuest(true); return null; }
                if (!res.ok) throw new Error("Unable to load monthly insights.");
                return res.json() as Promise<MonthlyInsightsResponse>;
            })
            .then((payload) => { if (payload) setData(payload); })
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error loading data."))
            .finally(() => setLoading(false));
    }, [monthOffset]);

    return (
        <PageTransition>
            <div className="space-y-6">
                <PageHeader
                    eyebrow="monthly insights"
                    title={data?.month.label ?? "Monthly Overview"}
                    subtitle="Your wellness trends across the full month."
                    action={
                        <Link href="/app/insights" className="text-sm text-clay hover:text-ink transition-colors">
                            ← Weekly view
                        </Link>
                    }
                />

                {/* Month navigation */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setMonthOffset((o) => o + 1)}
                        className="flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Previous month
                    </button>
                    <span className="font-mono text-xs text-muted uppercase tracking-wider">
                        {data?.month.label ?? "..."}
                    </span>
                    <button
                        onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
                        disabled={monthOffset === 0}
                        className="flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors disabled:opacity-30"
                    >
                        Next month <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {guest && (
                    <Card className="min-h-48">
                        <EmptyState
                            icon={<TrendingUp className="size-8" />}
                            title="Sign in to see monthly insights"
                            body="View your wellness trends over the full month."
                            action={{ label: "Sign in", onClick: () => openModal("login") }}
                        />
                    </Card>
                )}

                {error && <QueryError error={new Error(error)} retry={() => window.location.reload()} />}

                {loading && !data && !guest && (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                        {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {data && (
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                        {/* Energy heatmap */}
                        <motion.div variants={fadeUp}>
                            <Card className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Battery className="w-4 h-4 text-clay" />
                                        <h3 className="text-sm font-medium text-ink">Energy Heatmap</h3>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-muted">
                                        {data.energy.avg !== null && <span>Avg: {data.energy.avg}/10</span>}
                                        {data.energy.highest !== null && <span>Peak: {data.energy.highest}</span>}
                                    </div>
                                </div>
                                <EnergyHeatmap daily={data.energy.daily} />
                                <div className="flex items-center gap-2 mt-3 text-[9px] text-muted">
                                    <span>Low</span>
                                    <div className="flex gap-0.5">
                                        {[0.1, 0.3, 0.5, 0.7, 0.9].map((o) => (
                                            <div key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(184, 112, 79, ${o})` }} />
                                        ))}
                                    </div>
                                    <span>High</span>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Weekly comparison bars */}
                        <motion.div variants={fadeUp}>
                            <Card className="p-5">
                                <div className="flex items-center gap-2 mb-5">
                                    <TrendingUp className="w-4 h-4 text-sage" />
                                    <h3 className="text-sm font-medium text-ink">Week-over-Week</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <WeeklyBarGroup weeks={data.weeks} field="avgCalories" color="bg-clay" label="Avg Calories" />
                                    <WeeklyBarGroup weeks={data.weeks} field="workoutsCompleted" color="bg-sage" label="Workouts" />
                                    <WeeklyBarGroup weeks={data.weeks} field="avgWater" color="bg-sage/70" label="Avg Water (ml)" />
                                    <WeeklyBarGroup weeks={data.weeks} field="avgEnergy" color="bg-amber" label="Avg Energy" />
                                </div>
                            </Card>
                        </motion.div>

                        {/* Nutrition + Workouts row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div variants={fadeUp}>
                                <Card className="p-5 h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Utensils className="w-4 h-4 text-clay" />
                                        <h3 className="text-sm font-medium text-ink">Nutrition Summary</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <StatBlock label="Avg Calories" value={data.nutrition.avgCalories > 0 ? `${data.nutrition.avgCalories}` : "—"} />
                                        <StatBlock label="Avg Protein" value={data.nutrition.avgProtein > 0 ? `${data.nutrition.avgProtein}g` : "—"} />
                                        <StatBlock label="Avg Carbs" value={data.nutrition.avgCarbs > 0 ? `${data.nutrition.avgCarbs}g` : "—"} />
                                        <StatBlock label="Avg Fat" value={data.nutrition.avgFat > 0 ? `${data.nutrition.avgFat}g` : "—"} />
                                    </div>
                                    <p className="text-[10px] text-muted mt-3">{data.nutrition.daysLogged} days logged this month</p>
                                </Card>
                            </motion.div>

                            <motion.div variants={fadeUp}>
                                <Card className="p-5 h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Dumbbell className="w-4 h-4 text-sage" />
                                        <h3 className="text-sm font-medium text-ink">Workout Summary</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <StatBlock label="Completed" value={`${data.workouts.completed}`} sub={`of ${data.workouts.total} planned`} />
                                        <StatBlock label="Avg Duration" value={data.workouts.avgDuration > 0 ? `${data.workouts.avgDuration}m` : "—"} />
                                        <StatBlock label="Total Time" value={data.workouts.totalMinutes > 0 ? `${data.workouts.totalMinutes}m` : "—"} />
                                        <StatBlock label="Skipped" value={`${data.workouts.skipped}`} />
                                    </div>
                                    {Object.keys(data.workouts.intensityBreakdown).length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            {Object.entries(data.workouts.intensityBreakdown).map(([intensity, count]) => (
                                                <Chip key={intensity} tone="sage">{intensity}: {count}</Chip>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        </div>

                        {/* Cycle + Sleep + Hydration row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <motion.div variants={fadeUp}>
                                <Card className="p-5 h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar className="w-4 h-4 text-blush" />
                                        <h3 className="text-sm font-medium text-ink">Cycle</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">Period days</span>
                                            <span className="text-ink font-medium">{data.cycle.periodDays}</span>
                                        </div>
                                        {data.cycle.avgPain !== null && (
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted">Avg pain</span>
                                                <span className="text-ink font-medium">{data.cycle.avgPain}/10</span>
                                            </div>
                                        )}
                                        {data.cycle.symptoms.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-[10px] text-muted mb-1.5">Top symptoms</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {data.cycle.symptoms.slice(0, 5).map((s) => (
                                                        <Chip key={s.name} tone="blush">{s.name} ({s.count})</Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {data.cycle.moods.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-[10px] text-muted mb-1.5">Moods</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {data.cycle.moods.slice(0, 4).map((m) => (
                                                        <Chip key={m.name} tone="bone">{m.name} ({m.count})</Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>

                            <motion.div variants={fadeUp}>
                                <Card className="p-5 h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Moon className="w-4 h-4 text-blush" />
                                        <h3 className="text-sm font-medium text-ink">Sleep</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">Average</span>
                                            <span className="text-ink font-medium">{data.sleep.avg !== null ? `${data.sleep.avg}h` : "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">Best night</span>
                                            <span className="text-ink font-medium">{data.sleep.best !== null ? `${data.sleep.best}h` : "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">Worst night</span>
                                            <span className="text-ink font-medium">{data.sleep.worst !== null ? `${data.sleep.worst}h` : "—"}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">Days logged</span>
                                            <span className="text-ink font-medium">{data.sleep.daysLogged}</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>

                            <motion.div variants={fadeUp}>
                                <Card className="p-5 h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Droplets className="w-4 h-4 text-sage" />
                                        <h3 className="text-sm font-medium text-ink">Hydration</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">Daily average</span>
                                            <span className="text-ink font-medium">
                                                {data.hydration.avgMl > 0 ? (data.hydration.avgMl >= 1000 ? `${(data.hydration.avgMl / 1000).toFixed(1)}L` : `${data.hydration.avgMl}ml`) : "—"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">Days above 2L</span>
                                            <span className="text-ink font-medium">{data.hydration.daysAbove2L}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted">Days logged</span>
                                            <span className="text-ink font-medium">{data.hydration.daysLogged}</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </div>
        </PageTransition>
    );
}
