import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";

export type WeeklyInsightsResponse = {
    week: { start: string; end: string };
    energy: { date: string; score: number | null }[];
    nutrition: {
        date: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    }[];
    water: { date: string; ml: number }[];
    workouts: {
        date: string;
        completed: boolean;
        name: string | null;
        duration: number | null;
        intensity: string | null;
    }[];
    cycle: {
        date: string;
        phase: string | null;
        painScore: number | null;
        mood: string | null;
        symptoms: string[];
    }[];
    sleep: { date: string; hours: number | null }[];
    summary: {
        avgEnergy: number | null;
        totalCalories: number;
        avgCalories: number;
        totalProtein: number;
        avgWater: number;
        workoutsCompleted: number;
        workoutsPlanned: number;
        avgSleep: number | null;
        dominantMood: string | null;
    };
};

function getWeekRange(offset = 0): { start: string; end: string } {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset - offset * 7);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
        start: monday.toISOString().slice(0, 10),
        end: sunday.toISOString().slice(0, 10),
    };
}

function isInRange(date: string, start: string, end: string): boolean {
    return date >= start && date <= end;
}

function mostFrequent(items: (string | null | undefined)[]): string | null {
    const counts: Record<string, number> = {};
    for (const item of items) {
        if (item) counts[item] = (counts[item] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? null;
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const week = getWeekRange(offset);

    const context = await getUserContext(user.id);

    // Filter data to this week
    const weekDailyLogs = context.dailyLogs.filter((l) => isInRange(l.date, week.start, week.end));
    const weekMealLogs = context.mealLogs.filter((l) => isInRange(l.date, week.start, week.end));
    const weekWorkoutLogs = context.workoutLogs.filter((l) => isInRange(l.date, week.start, week.end));
    const weekCycleLogs = context.cycleLogs.filter((l) => isInRange(l.date, week.start, week.end));

    // Build day-by-day arrays for the 7 days
    const days: string[] = [];
    const d = new Date(`${week.start}T00:00:00`);
    for (let i = 0; i < 7; i++) {
        days.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
    }

    const energy = days.map((date) => {
        const log = weekDailyLogs.find((l) => l.date === date);
        const cycleLog = weekCycleLogs.find((l) => l.date === date);
        return { date, score: log?.energy_score ?? cycleLog?.energy_score ?? null };
    });

    const nutrition = days.map((date) => {
        const meals = weekMealLogs.filter((m) => m.date === date);
        return {
            date,
            calories: meals.reduce((s, m) => s + (m.calories ?? 0), 0),
            protein: meals.reduce((s, m) => s + (m.protein_g ?? 0), 0),
            carbs: meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0),
            fat: meals.reduce((s, m) => s + (m.fat_g ?? 0), 0),
        };
    });

    const water = days.map((date) => {
        const log = weekDailyLogs.find((l) => l.date === date);
        return { date, ml: log?.water_ml ?? 0 };
    });

    const workouts = days.map((date) => {
        const log = weekWorkoutLogs.find((l) => l.date === date);
        return {
            date,
            completed: log?.completed ?? false,
            name: log?.workout_name ?? null,
            duration: log?.duration_minutes ?? null,
            intensity: log?.intensity ?? null,
        };
    });

    const cycle = days.map((date) => {
        const log = weekCycleLogs.find((l) => l.date === date);
        return {
            date,
            phase: null, // Phase is computed from cycle profile, not stored per-log
            painScore: log?.pain_score ?? null,
            mood: log?.mood ?? null,
            symptoms: log?.symptoms ?? [],
        };
    });

    const sleep = days.map((date) => {
        const log = weekDailyLogs.find((l) => l.date === date);
        return { date, hours: log?.sleep_hours ?? null };
    });

    // Summary stats
    const energyScores = energy.map((e) => e.score).filter((s): s is number => s !== null);
    const sleepHours = sleep.map((s) => s.hours).filter((h): h is number => h !== null);
    const waterValues = water.map((w) => w.ml).filter((v) => v > 0);
    const totalCalories = nutrition.reduce((s, n) => s + n.calories, 0);
    const daysWithCalories = nutrition.filter((n) => n.calories > 0).length;

    const summary = {
        avgEnergy: energyScores.length > 0 ? Math.round((energyScores.reduce((a, b) => a + b, 0) / energyScores.length) * 10) / 10 : null,
        totalCalories,
        avgCalories: daysWithCalories > 0 ? Math.round(totalCalories / daysWithCalories) : 0,
        totalProtein: nutrition.reduce((s, n) => s + n.protein, 0),
        avgWater: waterValues.length > 0 ? Math.round(waterValues.reduce((a, b) => a + b, 0) / waterValues.length) : 0,
        workoutsCompleted: workouts.filter((w) => w.completed).length,
        workoutsPlanned: context.fitnessPreferences?.workout_days_per_week ?? 0,
        avgSleep: sleepHours.length > 0 ? Math.round((sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length) * 10) / 10 : null,
        dominantMood: mostFrequent([...weekDailyLogs.map((l) => l.mood), ...weekCycleLogs.map((l) => l.mood)]),
    };

    const response: WeeklyInsightsResponse = {
        week,
        energy,
        nutrition,
        water,
        workouts,
        cycle,
        sleep,
        summary,
    };

    return NextResponse.json(response);
}
