import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/supabase/helpers";

export type MonthlyInsightsResponse = {
    month: { year: number; month: number; label: string; start: string; end: string };
    weeks: {
        label: string;
        avgEnergy: number | null;
        avgCalories: number;
        workoutsCompleted: number;
        avgWater: number;
        avgSleep: number | null;
    }[];
    nutrition: {
        totalCalories: number;
        avgCalories: number;
        totalProtein: number;
        avgProtein: number;
        avgCarbs: number;
        avgFat: number;
        daysLogged: number;
    };
    workouts: {
        total: number;
        completed: number;
        skipped: number;
        totalMinutes: number;
        avgDuration: number;
        intensityBreakdown: Record<string, number>;
    };
    energy: {
        daily: { date: string; score: number | null }[];
        avg: number | null;
        highest: number | null;
        lowest: number | null;
    };
    cycle: {
        periodDays: number;
        avgPain: number | null;
        symptoms: { name: string; count: number }[];
        moods: { name: string; count: number }[];
    };
    hydration: {
        avgMl: number;
        daysAbove2L: number;
        daysLogged: number;
    };
    sleep: {
        avg: number | null;
        daysLogged: number;
        best: number | null;
        worst: number | null;
    };
};

function getMonthRange(offset = 0): { year: number; month: number; start: string; end: string; label: string } {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const label = targetMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return { year, month: month + 1, start, end, label };
}

function isInRange(date: string, start: string, end: string): boolean {
    return date >= start && date <= end;
}


export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);
    const monthRange = getMonthRange(offset);

    const context = await getUserContext(user.id);

    const dailyLogs = context.dailyLogs.filter((l) => isInRange(l.date, monthRange.start, monthRange.end));
    const mealLogs = context.mealLogs.filter((l) => isInRange(l.date, monthRange.start, monthRange.end));
    const workoutLogs = context.workoutLogs.filter((l) => isInRange(l.date, monthRange.start, monthRange.end));
    const cycleLogs = context.cycleLogs.filter((l) => isInRange(l.date, monthRange.start, monthRange.end));

    // Build all days in the month
    const allDays: string[] = [];
    const d = new Date(`${monthRange.start}T00:00:00`);
    const endDate = new Date(`${monthRange.end}T00:00:00`);
    while (d <= endDate) {
        allDays.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
    }

    // Weekly breakdown
    const weekCount = Math.ceil(allDays.length / 7);
    const weeks = Array.from({ length: weekCount }, (_, wi) => {
        const weekDays = allDays.slice(wi * 7, (wi + 1) * 7);
        const weekDaily = dailyLogs.filter((l) => weekDays.includes(l.date));
        const weekMeals = mealLogs.filter((l) => weekDays.includes(l.date));
        const weekWorkouts = workoutLogs.filter((l) => weekDays.includes(l.date));
        const weekCycle = cycleLogs.filter((l) => weekDays.includes(l.date));

        const energyScores = [...weekDaily.map((l) => l.energy_score), ...weekCycle.map((l) => l.energy_score)].filter((s): s is number => s !== null);
        const sleepHours = weekDaily.map((l) => l.sleep_hours).filter((h): h is number => h !== null);
        const waterValues = weekDaily.map((l) => l.water_ml).filter((v): v is number => v !== null && v > 0);
        const totalCals = weekMeals.reduce((s, m) => s + (m.calories ?? 0), 0);
        const daysWithCals = new Set(weekMeals.filter((m) => m.calories).map((m) => m.date)).size;

        return {
            label: `Week ${wi + 1}`,
            avgEnergy: energyScores.length > 0 ? Math.round((energyScores.reduce((a, b) => a + b, 0) / energyScores.length) * 10) / 10 : null,
            avgCalories: daysWithCals > 0 ? Math.round(totalCals / daysWithCals) : 0,
            workoutsCompleted: weekWorkouts.filter((w) => w.completed).length,
            avgWater: waterValues.length > 0 ? Math.round(waterValues.reduce((a, b) => a + b, 0) / waterValues.length) : 0,
            avgSleep: sleepHours.length > 0 ? Math.round((sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length) * 10) / 10 : null,
        };
    });

    // Nutrition summary
    const totalCalories = mealLogs.reduce((s, m) => s + (m.calories ?? 0), 0);
    const totalProtein = mealLogs.reduce((s, m) => s + (m.protein_g ?? 0), 0);
    const totalCarbs = mealLogs.reduce((s, m) => s + (m.carbs_g ?? 0), 0);
    const totalFat = mealLogs.reduce((s, m) => s + (m.fat_g ?? 0), 0);
    const daysWithMeals = new Set(mealLogs.filter((m) => m.calories).map((m) => m.date)).size;

    const nutrition = {
        totalCalories,
        avgCalories: daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0,
        totalProtein,
        avgProtein: daysWithMeals > 0 ? Math.round(totalProtein / daysWithMeals) : 0,
        avgCarbs: daysWithMeals > 0 ? Math.round(totalCarbs / daysWithMeals) : 0,
        avgFat: daysWithMeals > 0 ? Math.round(totalFat / daysWithMeals) : 0,
        daysLogged: daysWithMeals,
    };

    // Workouts summary
    const completedWorkouts = workoutLogs.filter((w) => w.completed);
    const totalMinutes = completedWorkouts.reduce((s, w) => s + (w.duration_minutes ?? 0), 0);
    const intensityBreakdown: Record<string, number> = {};
    for (const w of completedWorkouts) {
        const intensity = w.intensity ?? "unknown";
        intensityBreakdown[intensity] = (intensityBreakdown[intensity] || 0) + 1;
    }

    const workouts = {
        total: workoutLogs.length,
        completed: completedWorkouts.length,
        skipped: workoutLogs.filter((w) => !w.completed).length,
        totalMinutes,
        avgDuration: completedWorkouts.length > 0 ? Math.round(totalMinutes / completedWorkouts.length) : 0,
        intensityBreakdown,
    };

    // Energy daily
    const energyDaily = allDays.map((date) => {
        const log = dailyLogs.find((l) => l.date === date);
        const cycleLog = cycleLogs.find((l) => l.date === date);
        return { date, score: log?.energy_score ?? cycleLog?.energy_score ?? null };
    });
    const allEnergy = energyDaily.map((e) => e.score).filter((s): s is number => s !== null);

    const energy = {
        daily: energyDaily,
        avg: allEnergy.length > 0 ? Math.round((allEnergy.reduce((a, b) => a + b, 0) / allEnergy.length) * 10) / 10 : null,
        highest: allEnergy.length > 0 ? Math.max(...allEnergy) : null,
        lowest: allEnergy.length > 0 ? Math.min(...allEnergy) : null,
    };

    // Cycle summary
    const periodDays = cycleLogs.filter((l) => l.is_period_day).length;
    const painScores = cycleLogs.map((l) => l.pain_score).filter((s): s is number => s !== null);
    const symptomCounts: Record<string, number> = {};
    const moodCounts: Record<string, number> = {};
    for (const log of cycleLogs) {
        if (log.symptoms) {
            for (const s of log.symptoms) { symptomCounts[s] = (symptomCounts[s] || 0) + 1; }
        }
        if (log.mood) { moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1; }
    }

    const cycle = {
        periodDays,
        avgPain: painScores.length > 0 ? Math.round((painScores.reduce((a, b) => a + b, 0) / painScores.length) * 10) / 10 : null,
        symptoms: Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
        moods: Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    };

    // Hydration
    const waterLogs = dailyLogs.filter((l) => l.water_ml !== null && l.water_ml > 0);
    const hydration = {
        avgMl: waterLogs.length > 0 ? Math.round(waterLogs.reduce((s, l) => s + (l.water_ml ?? 0), 0) / waterLogs.length) : 0,
        daysAbove2L: waterLogs.filter((l) => (l.water_ml ?? 0) >= 2000).length,
        daysLogged: waterLogs.length,
    };

    // Sleep
    const sleepLogs = dailyLogs.filter((l) => l.sleep_hours !== null);
    const sleepValues = sleepLogs.map((l) => l.sleep_hours!);
    const sleep = {
        avg: sleepValues.length > 0 ? Math.round((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length) * 10) / 10 : null,
        daysLogged: sleepLogs.length,
        best: sleepValues.length > 0 ? Math.max(...sleepValues) : null,
        worst: sleepValues.length > 0 ? Math.min(...sleepValues) : null,
    };

    const response: MonthlyInsightsResponse = {
        month: { year: monthRange.year, month: monthRange.month, label: monthRange.label, start: monthRange.start, end: monthRange.end },
        weeks,
        nutrition,
        workouts,
        energy,
        cycle,
        hydration,
        sleep,
    };

    return NextResponse.json(response);
}
