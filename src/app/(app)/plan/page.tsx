"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    ChevronDown,
    Droplets,
    Dumbbell,
    Heart,
    Leaf,
    Moon,
    RefreshCw,
    Sparkles,
    Utensils,
    Zap,
} from "lucide-react";
import {
    Button,
    Card,
    Chip,
    EmptyState,
    Eyebrow,
    PageTransition,
    QueryError,
    SafetyBanner,
    SkeletonCard,
} from "@/components/ui";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/store/auth-modal.store";
import type { TodayPlanResponse, MealSuggestion } from "@/app/api/plan/today/route";

function formatPhase(phase: string) {
    return phase.charAt(0).toUpperCase() + phase.slice(1).toLowerCase();
}

/* ─── Context Banner ─── */
function ContextBanner({ context }: { context: TodayPlanResponse["context"] }) {
    return (
        <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-hairline bg-gradient-to-r from-claySoft/20 via-card to-sageSoft/20 p-5"
        >
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-clay" />
                    <span className="text-sm font-medium text-ink">
                        {formatPhase(context.cyclePhase)} phase
                        {context.cycleDay ? ` · Day ${context.cycleDay}` : ""}
                    </span>
                </div>
                {context.energyScore !== null && (
                    <Chip tone="clay">
                        <Zap className="w-3 h-3 mr-1" /> Energy: {context.energyScore}/10
                    </Chip>
                )}
                {context.goal && (
                    <Chip tone="sage">{context.goal.replace(/_/g, " ")}</Chip>
                )}
                {context.healthFlags.map((flag) => (
                    <Chip key={flag} tone="blush">{flag}</Chip>
                ))}
            </div>
        </motion.div>
    );
}

/* ─── Workout Card ─── */
function WorkoutCard({ workout }: { workout: TodayPlanResponse["workout"] }) {
    const [expanded, setExpanded] = useState(false);

    if (!workout) {
        return (
            <motion.div variants={fadeUp}>
                <Card className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="w-4 h-4 text-sage" />
                        <Eyebrow>workout</Eyebrow>
                    </div>
                    <p className="text-sm text-muted">No workout generated yet. Complete onboarding to get personalised plans.</p>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div variants={fadeUp}>
            <Card className="overflow-hidden">
                <div className="border-l-[3px] border-sage p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <Eyebrow>today&apos;s workout</Eyebrow>
                            <h3 className="mt-1 font-display text-xl italic text-ink">{workout.name}</h3>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                <Chip tone="neutral">{workout.duration} min</Chip>
                                <Chip tone={workout.intensity === "low" ? "sage" : workout.intensity === "high" ? "alert" : "clay"}>
                                    {workout.intensity}
                                </Chip>
                                <Chip tone="bone">{workout.type}</Chip>
                            </div>
                        </div>
                        <Link href="/app/workout">
                            <Button variant="accent" size="sm">
                                <Dumbbell className="w-3.5 h-3.5" /> Start
                            </Button>
                        </Link>
                    </div>

                    {/* Why this workout */}
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-shell/40 p-3">
                        <Sparkles className="w-4 h-4 text-clay mt-0.5 shrink-0" />
                        <p className="text-xs text-ink2 leading-relaxed">{workout.whyThisWorkout}</p>
                    </div>

                    {/* Exercises (collapsible) */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-4 flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors"
                    >
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
                        {expanded ? "Hide" : "Show"} {workout.exercises.length} exercises
                    </button>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 space-y-1.5">
                                    {workout.exercises.map((ex, i) => (
                                        <div key={i} className="flex items-center gap-3 rounded-lg bg-card border border-hairline/40 px-3 py-2">
                                            <span className="font-mono text-[10px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                                            <span className="text-sm text-ink flex-1">{ex.name}</span>
                                            <span className="text-xs text-muted">
                                                {ex.duration ?? (ex.sets ? `${ex.sets}×${ex.reps}` : "")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {workout.warmup && (
                                    <p className="mt-3 text-xs text-muted"><span className="font-medium text-ink">Warmup:</span> {workout.warmup}</p>
                                )}
                                {workout.cooldown && (
                                    <p className="mt-1 text-xs text-muted"><span className="font-medium text-ink">Cooldown:</span> {workout.cooldown}</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </motion.div>
    );
}

/* ─── Meal Card ─── */
function MealCard({ meal }: { meal: MealSuggestion }) {
    const [expanded, setExpanded] = useState(false);
    const mealIcons: Record<string, typeof Utensils> = {
        breakfast: Leaf,
        lunch: Utensils,
        dinner: Utensils,
        snack: Heart,
    };
    const Icon = mealIcons[meal.mealType] ?? Utensils;
    const label = meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);

    return (
        <motion.div variants={fadeUp}>
            <div className="rounded-2xl border border-hairline bg-card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-claySoft/30 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-clay" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-muted">{label}</span>
                        </div>
                        <h4 className="mt-0.5 text-base font-medium text-ink">{meal.mealName}</h4>
                        <p className="mt-1 text-xs text-muted leading-relaxed">{meal.reason}</p>

                        {/* Macros */}
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
                            <span>{meal.estimatedCalories} kcal</span>
                            <span>·</span>
                            <span>{meal.estimatedMacros.proteinG}g protein</span>
                            <span>·</span>
                            <span>{meal.estimatedMacros.carbsG}g carbs</span>
                            <span>·</span>
                            <span>{meal.estimatedMacros.fatG}g fat</span>
                        </div>

                        {/* Ingredients (collapsible) */}
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="mt-2 text-[11px] text-clay hover:text-ink transition-colors"
                        >
                            {expanded ? "Hide ingredients" : `${meal.ingredients.length} ingredients →`}
                        </button>

                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {meal.ingredients.map((ing) => (
                                            <Chip key={ing} tone="bone">{ing}</Chip>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {meal.safetyNote && (
                            <SafetyBanner tone="info" title="Note" body={meal.safetyNote} className="mt-3 p-2.5 pl-3" />
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Hydration & Recovery ─── */
function HydrationRecoveryCard({ hydration, recovery }: {
    hydration: TodayPlanResponse["hydration"];
    recovery: string[];
}) {
    const percent = hydration.targetMl > 0 ? Math.min(1, hydration.consumedMl / hydration.targetMl) : 0;

    return (
        <motion.div variants={fadeUp}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hydration */}
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Droplets className="w-4 h-4 text-sage" />
                        <Eyebrow>hydration</Eyebrow>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="font-display text-2xl text-ink">
                            {hydration.consumedMl >= 1000 ? `${(hydration.consumedMl / 1000).toFixed(1)}L` : `${hydration.consumedMl}ml`}
                        </span>
                        <span className="text-xs text-muted mb-1">
                            / {hydration.targetMl >= 1000 ? `${(hydration.targetMl / 1000).toFixed(1)}L` : `${hydration.targetMl}ml`}
                        </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-shell">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-sage"
                        />
                    </div>
                </Card>

                {/* Recovery */}
                <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-blush" />
                        <Eyebrow>recovery notes</Eyebrow>
                    </div>
                    <ul className="space-y-2">
                        {recovery.map((note, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted leading-relaxed">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-blush shrink-0" />
                                {note}
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </motion.div>
    );
}

/* ─── Main Page ─── */
export default function TodayPlanPage() {
    const [data, setData] = useState<TodayPlanResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [guest, setGuest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const openModal = useAuthModalStore((state) => state.openModal);

    function fetchPlan() {
        setLoading(true);
        setError(null);
        fetch("/api/plan/today", { credentials: "include" })
            .then((res) => {
                if (res.status === 401) { setGuest(true); return null; }
                if (!res.ok) throw new Error("Unable to generate today's plan.");
                return res.json() as Promise<TodayPlanResponse>;
            })
            .then((payload) => { if (payload) setData(payload); })
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error loading plan."))
            .finally(() => { setLoading(false); setRegenerating(false); });
    }

    useEffect(() => { fetchPlan(); }, []);

    function regenerate() {
        setRegenerating(true);
        fetchPlan();
    }

    const now = new Date();
    const timeOfDay = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
    const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    return (
        <PageTransition>
            <div className="space-y-6 pb-8">
                {/* Header */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-clay">your daily plan</p>
                    <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="font-display text-3xl text-ink">
                                Good {timeOfDay} <span className="pulse-star inline-block text-clay">✦</span>
                            </h1>
                            <p className="mt-1 text-sm text-muted">Here&apos;s what Karigai has prepared for you today.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{dateLabel}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                loading={regenerating}
                                onClick={regenerate}
                                className="border-hairline"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {guest && (
                    <Card className="min-h-48">
                        <EmptyState
                            icon={<Sparkles className="size-8" />}
                            title="Sign in to see your daily plan"
                            body="Get personalised workout and meal suggestions based on your cycle, conditions, and goals."
                            action={{ label: "Sign in", onClick: () => openModal("login") }}
                        />
                    </Card>
                )}

                {error && <QueryError error={new Error(error)} retry={fetchPlan} />}

                {loading && !data && !guest && (
                    <div className="space-y-4">
                        <SkeletonCard />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                        <SkeletonCard />
                    </div>
                )}

                {data && (
                    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
                        {/* Context banner */}
                        <ContextBanner context={data.context} />

                        {/* AI insight */}
                        <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl bg-shell/40 border border-hairline p-4">
                            <Sparkles className="w-4 h-4 text-clay mt-0.5 shrink-0" />
                            <p className="text-sm text-ink2 leading-relaxed italic">{data.insight}</p>
                        </motion.div>

                        {/* Workout */}
                        <WorkoutCard workout={data.workout} />

                        {/* Meals */}
                        <motion.div variants={fadeUp}>
                            <div className="flex items-center gap-2 mb-4">
                                <Utensils className="w-4 h-4 text-clay" />
                                <h2 className="text-sm font-medium text-ink">Meal Suggestions</h2>
                                <span className="text-[10px] text-muted">· personalised to your phase & goals</span>
                            </div>
                            <div className="space-y-3">
                                {data.meals.map((meal) => (
                                    <MealCard key={meal.mealType} meal={meal} />
                                ))}
                            </div>
                        </motion.div>

                        {/* Hydration & Recovery */}
                        <HydrationRecoveryCard hydration={data.hydration} recovery={data.recovery} />
                    </motion.div>
                )}
            </div>
        </PageTransition>
    );
}
