import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";
import { calculateCycleStatus } from "@/lib/cycle-engine";
import type { CyclePhase } from "@/lib/cycle-engine";
import { buildUserTargets } from "@/lib/health-engine";
import { runPersonalizationRules } from "@/lib/safety-rules";
import { buildMealSuggestionPrompt } from "@/lib/ai-prompt-engine";
import { calculateMacroTargets, calculateRemaining, summarizeMealLogs } from "@/lib/nutrition-engine";
import { generateWorkoutFromRules } from "@/lib/workout-engine";
import type { WorkoutPlan } from "@/lib/workout-engine";

export type MealSuggestion = {
    mealType: string;
    mealName: string;
    ingredients: string[];
    estimatedCalories: number;
    estimatedMacros: { proteinG: number; carbsG: number; fatG: number; fiberG: number };
    reason: string;
    safetyNote?: string;
};

export type TodayPlanResponse = {
    context: {
        cyclePhase: string;
        cycleDay: number | null;
        energyScore: number | null;
        healthFlags: string[];
        goal: string | null;
    };
    workout: WorkoutPlan | null;
    meals: MealSuggestion[];
    hydration: {
        targetMl: number;
        consumedMl: number;
    };
    recovery: string[];
    insight: string;
};

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

function parseMealSuggestion(content: string, mealType: string): MealSuggestion {
    try {
        const parsed = JSON.parse(content);
        if (typeof parsed.mealName === "string" && Array.isArray(parsed.ingredients)) {
            return {
                mealType,
                mealName: parsed.mealName,
                ingredients: parsed.ingredients.filter((i: unknown): i is string => typeof i === "string"),
                estimatedCalories: parsed.estimatedCalories ?? 400,
                estimatedMacros: {
                    proteinG: parsed.estimatedMacros?.proteinG ?? 20,
                    carbsG: parsed.estimatedMacros?.carbsG ?? 40,
                    fatG: parsed.estimatedMacros?.fatG ?? 15,
                    fiberG: parsed.estimatedMacros?.fiberG ?? 5,
                },
                reason: parsed.reason ?? "Balanced nutrition for your current phase.",
                safetyNote: typeof parsed.safetyNote === "string" ? parsed.safetyNote : undefined,
            };
        }
    } catch { /* fallback below */ }

    return {
        mealType,
        mealName: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} power bowl`,
        ingredients: ["lentils", "brown rice", "spinach", "cucumber", "lemon", "olive oil"],
        estimatedCalories: 450,
        estimatedMacros: { proteinG: 22, carbsG: 50, fatG: 14, fiberG: 8 },
        reason: "A balanced meal with steady protein and fibre to support your energy.",
        safetyNote: undefined,
    };
}

function getRecoveryNotes(phase: string, energy: number | null, painScore: number | null): string[] {
    const notes: string[] = [];
    if (phase === "Menstrual" || phase === "menstrual") {
        notes.push("Prioritise rest and gentle movement today.");
        notes.push("Warm drinks and iron-rich snacks may help with energy.");
    }
    if (phase === "Luteal" || phase === "luteal") {
        notes.push("Progesterone is high — fatigue is normal. Be kind to yourself.");
    }
    if (energy !== null && energy <= 4) {
        notes.push("Your energy is low today. Consider a shorter workout or a walk instead.");
    }
    if (painScore !== null && painScore >= 6) {
        notes.push("Pain is elevated. Gentle stretching or rest is recommended over intense exercise.");
    }
    if (notes.length === 0) {
        notes.push("You're in a good phase for balanced activity and nutrition.");
    }
    return notes;
}

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const ctx = await getUserContext(user.id);
    const today = todayIsoDate();
    const todayCycleLog = ctx.cycleLogs.find((l) => l.date === today) ?? null;
    const cycleStatus = ctx.cycleProfile?.last_period_start
        ? calculateCycleStatus(ctx.cycleProfile, todayCycleLog, new Date(`${today}T00:00:00`))
        : null;

    const rules = runPersonalizationRules({
        healthContext: ctx.healthContext,
        dietPreferences: ctx.dietPreferences,
        fastingPreferences: ctx.fastingPreferences,
        fitnessPreferences: ctx.fitnessPreferences,
        cyclePhase: ctx.currentCyclePhase as CyclePhase | undefined,
        todayEnergyScore: ctx.todayEnergyScore,
        todayPainScore: todayCycleLog?.pain_score ?? undefined,
    });

    const healthFlags: string[] = [];
    if (ctx.healthContext) {
        if (ctx.healthContext.has_pcos) healthFlags.push("PCOS");
        if (ctx.healthContext.has_thyroid_condition) healthFlags.push("Thyroid");
        if (ctx.healthContext.has_iron_deficiency) healthFlags.push("Iron deficiency");
        if (ctx.healthContext.has_irregular_periods) healthFlags.push("Irregular periods");
    }

    // Generate workout
    let workout: WorkoutPlan | null = null;
    try {
        workout = generateWorkoutFromRules(ctx, rules);
    } catch { /* workout stays null */ }

    // Generate meal suggestions for all meal types
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    const meals: MealSuggestion[] = [];

    const todaysMeals = ctx.mealLogs.filter((m) => m.date === today);
    const summary = summarizeMealLogs(todaysMeals);
    const macroTargets = calculateMacroTargets(ctx);
    const remaining = calculateRemaining(macroTargets, summary);

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Anthropic = require("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        // Generate all meals in parallel
        const mealPromises = mealTypes.map(async (mealType) => {
            const prompt = buildMealSuggestionPrompt(ctx, rules, mealType, remaining.calories);
            try {
                const msg = await client.messages.create({
                    model: "claude-sonnet-4-5-20250514",
                    max_tokens: 600,
                    messages: [{ role: "user", content: prompt }],
                });
                const firstBlock = msg.content?.[0];
                const text = typeof firstBlock?.text === "string" ? firstBlock.text : "";
                return parseMealSuggestion(text, mealType);
            } catch {
                return parseMealSuggestion("", mealType);
            }
        });

        const results = await Promise.all(mealPromises);
        meals.push(...results);
    } catch {
        // Fallback meals if AI is unavailable
        for (const mealType of mealTypes) {
            meals.push(parseMealSuggestion("", mealType));
        }
    }

    // Hydration
    const todayDailyLog = ctx.dailyLogs.find((l) => l.date === today);
    const userTargets = ctx.profile ? buildUserTargets(ctx.profile, ctx.goals, ctx.healthContext) : null;
    const waterTarget = userTargets?.waterTargetMl ?? 2500;
    const waterConsumed = todayDailyLog?.water_ml ?? 0;

    // Recovery notes
    const phase = cycleStatus?.cyclePhase ?? ctx.currentCyclePhase ?? "unknown";
    const recovery = getRecoveryNotes(phase, ctx.todayEnergyScore ?? null, todayCycleLog?.pain_score ?? null);

    // Insight
    const phaseLabel = cycleStatus?.cyclePhase ?? "your current phase";
    const insight = workout
        ? `Today's plan is shaped by ${phaseLabel} and your energy level. ${workout.whyThisWorkout}`
        : `Your meals are tailored to ${phaseLabel}. Listen to your body and adjust as needed.`;

    const response: TodayPlanResponse = {
        context: {
            cyclePhase: cycleStatus?.cyclePhase ?? ctx.currentCyclePhase ?? "Unknown",
            cycleDay: cycleStatus?.cycleDay ?? null,
            energyScore: ctx.todayEnergyScore ?? null,
            healthFlags,
            goal: ctx.goals?.primary_goal ?? null,
        },
        workout,
        meals,
        hydration: { targetMl: waterTarget, consumedMl: waterConsumed },
        recovery,
        insight,
    };

    return NextResponse.json(response);
}
