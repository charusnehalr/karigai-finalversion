"use client";

import { motion } from "framer-motion";
import {
    Activity,
    Brain,
    Heart,
    Moon,
    Sparkles,
    TrendingUp,
    Shield,
    Utensils,
    Dumbbell,
    ArrowRight,
    ChevronDown,
    Zap,
    BarChart3,
    MessageCircle,
    Calendar,
    Target,
    Waves,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ─── Animation Variants ─── */
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } },
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1 } },
};

const stagger = {
    visible: { transition: { staggerChildren: 0.15 } },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" as const } },
};

/* ─── Custom Cursor with Glowing Particles ─── */
interface Particle {
    id: number;
    x: number;
    y: number;
    opacity: number;
    scale: number;
    color: string;
    vx: number;
    vy: number;
}

function CustomCursor() {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isTouch, setIsTouch] = useState(false);
    const idRef = useRef(0);
    const lastSpawn = useRef(0);

    useEffect(() => {
        if (window.matchMedia("(pointer: coarse)").matches) {
            setIsTouch(true);
            return;
        }

        const colors = [
            "rgba(184, 112, 79, 0.9)",   // clay
            "rgba(201, 147, 86, 0.8)",   // amber
            "rgba(122, 139, 111, 0.7)",  // sage
            "rgba(232, 180, 168, 0.6)",  // blush
            "rgba(233, 200, 181, 0.7)",  // claySoft
            "rgba(184, 112, 79, 0.7)",   // clay lighter
            "rgba(201, 147, 86, 0.6)",   // amber lighter
        ];

        const handleMouseMove = (e: MouseEvent) => {
            setCursorPos({ x: e.clientX, y: e.clientY });

            const now = Date.now();
            if (now - lastSpawn.current < 18) return;
            lastSpawn.current = now;

            const count = Math.floor(Math.random() * 2) + 2;
            const newParticles: Particle[] = [];

            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: idRef.current++,
                    x: e.clientX + (Math.random() - 0.5) * 16,
                    y: e.clientY + (Math.random() - 0.5) * 16,
                    opacity: 1,
                    scale: Math.random() * 1.2 + 0.5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2 - 1,
                });
            }

            setParticles((prev) => [...prev.slice(-40), ...newParticles]);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Animate particles
    useEffect(() => {
        if (isTouch) return;
        const interval = setInterval(() => {
            setParticles((prev) =>
                prev
                    .map((p) => ({
                        ...p,
                        opacity: p.opacity - 0.03,
                        scale: p.scale * 0.96,
                        x: p.x + p.vx,
                        y: p.y + p.vy,
                    }))
                    .filter((p) => p.opacity > 0)
            );
        }, 25);
        return () => clearInterval(interval);
    }, [isTouch]);

    if (isTouch) return null;

    return (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
            {/* Main cursor glow */}
            <div
                className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                    left: cursorPos.x,
                    top: cursorPos.y,
                    background:
                        "radial-gradient(circle, rgba(184,112,79,0.6) 0%, rgba(201,147,86,0.2) 40%, transparent 70%)",
                    boxShadow:
                        "0 0 20px rgba(184,112,79,0.4), 0 0 40px rgba(184,112,79,0.15), 0 0 60px rgba(201,147,86,0.1)",
                }}
            />

            {/* Outer ring */}
            <div
                className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-clay/20"
                style={{
                    left: cursorPos.x,
                    top: cursorPos.y,
                }}
            />

            {/* Trailing particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        opacity: particle.opacity,
                        transform: `translate(-50%, -50%) scale(${particle.scale})`,
                        background: `radial-gradient(circle, ${particle.color} 0%, transparent 70%)`,
                        boxShadow: `0 0 8px ${particle.color}, 0 0 16px ${particle.color}`,
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Animated SVG Graph (Cycle Visualization) ─── */
function CycleGraph() {
    const pathData = "M 0 60 C 40 20, 80 20, 120 50 C 160 80, 200 90, 240 60 C 280 30, 320 20, 360 50 C 400 80, 440 70, 480 40 C 520 10, 560 30, 600 60";
    const pathData2 = "M 0 80 C 50 60, 100 40, 150 55 C 200 70, 250 85, 300 70 C 350 55, 400 45, 450 60 C 500 75, 550 65, 600 50";

    return (
        <div className="relative w-full h-[200px] overflow-hidden">
            <svg viewBox="0 0 600 120" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[20, 40, 60, 80, 100].map((y) => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="currentColor" className="text-hairline" strokeWidth="0.5" />
                ))}
                {/* Energy curve */}
                <motion.path
                    d={pathData}
                    fill="none"
                    stroke="#B8704F"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: "easeOut" }}
                />
                {/* Hormone curve */}
                <motion.path
                    d={pathData2}
                    fill="none"
                    stroke="#7A8B6F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                />
                {/* Phase markers */}
                {[
                    { x: 75, label: "Follicular" },
                    { x: 200, label: "Ovulatory" },
                    { x: 350, label: "Luteal" },
                    { x: 520, label: "Menstrual" },
                ].map((phase) => (
                    <g key={phase.label}>
                        <line x1={phase.x} y1="0" x2={phase.x} y2="120" stroke="#E5DCCB" strokeWidth="0.5" strokeDasharray="3 3" />
                        <text x={phase.x} y="115" textAnchor="middle" className="fill-muted text-[8px]">{phase.label}</text>
                    </g>
                ))}
                {/* Glow dot */}
                <motion.circle
                    cx="240"
                    cy="60"
                    r="4"
                    fill="#B8704F"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.5 }}
                />
                <motion.circle
                    cx="240"
                    cy="60"
                    r="8"
                    fill="none"
                    stroke="#B8704F"
                    strokeWidth="1"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 0.4, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.7 }}
                />
            </svg>
            {/* Legend */}
            <div className="absolute bottom-2 right-4 flex items-center gap-4 text-[10px] text-muted">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-clay rounded" /> Energy</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-sage rounded border-dashed" /> Hormones</span>
            </div>
        </div>
    );
}

/* ─── Animated Wellness Score Ring ─── */
function WellnessRing() {
    return (
        <div className="relative w-48 h-48 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#EFE7DA" strokeWidth="6" />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#B8704F"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42}`}
                    whileInView={{ strokeDashoffset: 2 * Math.PI * 42 * 0.22 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: "easeOut" }}
                />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="34"
                    fill="none"
                    stroke="#7A8B6F"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34}`}
                    whileInView={{ strokeDashoffset: 2 * Math.PI * 34 * 0.35 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
                />
                <motion.circle
                    cx="50"
                    cy="50"
                    r="26"
                    fill="none"
                    stroke="#C99356"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26}`}
                    whileInView={{ strokeDashoffset: 2 * Math.PI * 26 * 0.15 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="font-display text-3xl text-ink"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1 }}
                >
                    78
                </motion.span>
                <span className="text-xs text-muted">Wellness Score</span>
            </div>
        </div>
    );
}

/* ─── Mini Bar Chart ─── */
function MiniBarChart() {
    const bars = [65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 88, 72];
    return (
        <div className="flex items-end gap-1.5 h-24 w-full">
            {bars.map((height, i) => (
                <motion.div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-clay/80 to-clay/30"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                />
            ))}
        </div>
    );
}

/* ─── Floating Card Component ─── */
function FloatingCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay, ease: "easeOut" }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`rounded-[20px] bg-card border border-hairline/60 shadow-lg shadow-ink/[0.03] backdrop-blur-sm ${className}`}
        >
            {children}
        </motion.div>
    );
}

/* ─── Navbar ─── */
function Navbar() {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-paper/80 border-b border-hairline/50"
        >
            <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/karigai-logo.png" alt="karigai" width={32} height={32} className="rounded-lg" />
                    <span className="font-display text-xl text-ink tracking-tight">karigai</span>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm text-muted">
                    <a href="#features" className="hover:text-ink transition-colors">Features</a>
                    <a href="#automation" className="hover:text-ink transition-colors">Automation</a>
                    <a href="#intelligence" className="hover:text-ink transition-colors">Intelligence</a>
                    <a href="#privacy" className="hover:text-ink transition-colors">Privacy</a>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="hidden sm:inline-flex items-center gap-1 text-sm text-muted hover:text-ink transition-colors"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:bg-ink2 transition-colors"
                    >
                        Get started
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
}

/* ─── Hero Section ─── */
function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 overflow-hidden">
            {/* Gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-claySoft/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-sageSoft/20 blur-[100px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber/5 blur-[150px] pointer-events-none" />

            <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="relative z-10 text-center max-w-5xl mx-auto"
            >
                <motion.div variants={fadeUp} className="mb-6">
                    <span className="inline-flex items-center gap-2 rounded-full bg-shell/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-clay border border-hairline">
                        <Sparkles className="w-3.5 h-3.5" />
                        Condition-aware wellness intelligence
                    </span>
                </motion.div>

                <motion.h1
                    variants={fadeUp}
                    className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] text-ink leading-[0.92] tracking-tight"
                >
                    Your body is not
                    <br />
                    <span className="italic text-clay">a guessing game.</span>
                </motion.h1>

                <motion.p
                    variants={fadeUp}
                    className="mt-8 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed"
                >
                    Karigai learns your cycle, conditions, and goals — then automatically adapts your
                    fitness, nutrition, and recovery every single day. Intelligence designed
                    for the female body.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/dashboard"
                        className="group inline-flex items-center gap-2 rounded-full bg-ink text-paper px-8 py-4 text-base font-medium hover:bg-ink2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Start your journey
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <a
                        href="#features"
                        className="inline-flex items-center gap-2 rounded-full border border-bone text-ink px-8 py-4 text-base font-medium hover:bg-shell/50 transition-all"
                    >
                        Explore features
                    </a>
                </motion.div>

                <motion.p variants={fadeUp} className="mt-6 text-xs text-muted/70">
                    Free to use · No credit card · Your data stays private
                </motion.p>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
                <ChevronDown className="w-5 h-5 text-muted animate-bounce" />
            </motion.div>
        </section>
    );
}

/* ─── Dashboard Showcase ─── */
function DashboardShowcase() {
    return (
        <section className="relative py-32 px-6">
            <div className="mx-auto max-w-6xl">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                    className="text-center mb-16"
                >
                    <motion.p variants={fadeUp} className="text-sm font-medium text-clay uppercase tracking-widest mb-4">
                        The Dashboard
                    </motion.p>
                    <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl text-ink">
                        Everything at a glance.
                    </motion.h2>
                    <motion.p variants={fadeUp} className="mt-4 text-lg text-muted max-w-xl mx-auto">
                        Your daily wellness score, cycle phase, workout plan, meal suggestions, and AI insights — all in one beautiful view.
                    </motion.p>
                </motion.div>

                {/* Dashboard screenshot with reflection */}
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="relative"
                >
                    {/* Main image */}
                    <div className="relative rounded-[24px] overflow-hidden border border-hairline shadow-2xl shadow-ink/8">
                        <div className="absolute inset-0 bg-gradient-to-b from-shell/10 to-transparent pointer-events-none z-10" />
                        <Image
                            src="/karigai-dashboard-demo.png"
                            alt="Karigai dashboard showing personalised wellness insights"
                            width={1920}
                            height={1080}
                            className="w-full h-auto"
                            priority
                        />
                    </div>
                    {/* Mirror reflection */}
                    <div className="relative mt-1 rounded-[24px] overflow-hidden h-32 opacity-30 pointer-events-none" style={{ transform: "scaleY(-1)" }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/80 to-transparent z-10" />
                        <Image
                            src="/karigai-dashboard-demo.png"
                            alt=""
                            width={1920}
                            height={1080}
                            className="w-full h-auto"
                            aria-hidden="true"
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ─── Analytics Deep Dive Section ─── */
function AnalyticsSection() {
    return (
        <section className="relative py-32 px-6 bg-cream overflow-hidden">
            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                    className="text-center mb-20"
                >
                    <motion.p variants={fadeUp} className="text-sm font-medium text-clay uppercase tracking-widest mb-4">
                        Deep Analytics
                    </motion.p>
                    <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl text-ink">
                        See the patterns your
                        <br />
                        <span className="italic">body is telling you.</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} className="mt-6 text-lg text-muted max-w-2xl mx-auto">
                        Karigai visualises the connection between your cycle phases, energy levels, workout performance,
                        and nutrition — revealing insights you&apos;d never spot on your own.
                    </motion.p>
                </motion.div>

                {/* Analytics cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Cycle graph - large */}
                    <FloatingCard className="lg:col-span-8 p-8" delay={0}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-medium text-ink">Cycle & Energy Correlation</h3>
                                <p className="text-xs text-muted mt-0.5">Last 28 days</p>
                            </div>
                            <div className="flex items-center gap-1 rounded-full bg-sageSoft/30 px-3 py-1">
                                <TrendingUp className="w-3 h-3 text-sage" />
                                <span className="text-xs text-sage font-medium">+12% energy</span>
                            </div>
                        </div>
                        <CycleGraph />
                    </FloatingCard>

                    {/* Wellness ring */}
                    <FloatingCard className="lg:col-span-4 p-8 flex flex-col items-center justify-center" delay={0.2}>
                        <WellnessRing />
                        <div className="mt-4 flex items-center gap-4 text-[11px] text-muted">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-clay" /> Fitness</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sage" /> Nutrition</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber" /> Recovery</span>
                        </div>
                    </FloatingCard>

                    {/* Weekly activity */}
                    <FloatingCard className="lg:col-span-5 p-8" delay={0.3}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-medium text-ink">Weekly Activity</h3>
                            <BarChart3 className="w-4 h-4 text-muted" />
                        </div>
                        <MiniBarChart />
                        <div className="mt-3 flex justify-between text-[10px] text-muted">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
                        </div>
                    </FloatingCard>

                    {/* Quick stats */}
                    <FloatingCard className="lg:col-span-7 p-8" delay={0.4}>
                        <h3 className="text-base font-medium text-ink mb-6">This Week&apos;s Insights</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Workouts", value: "5/6", icon: Dumbbell, color: "text-clay" },
                                { label: "Avg Energy", value: "7.2", icon: Zap, color: "text-amber" },
                                { label: "Meals Logged", value: "18", icon: Utensils, color: "text-sage" },
                                { label: "Sleep Score", value: "82", icon: Moon, color: "text-blush" },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center p-3 rounded-xl bg-cream/50">
                                    <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.color}`} />
                                    <div className="font-display text-xl text-ink">{stat.value}</div>
                                    <div className="text-[10px] text-muted mt-0.5">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </FloatingCard>
                </div>
            </div>
        </section>
    );
}

/* ─── Automation & Personalization Section ─── */
function AutomationSection() {
    return (
        <section id="automation" className="relative py-32 px-6 overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-claySoft/10 blur-[100px] pointer-events-none" />

            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                    className="text-center mb-20"
                >
                    <motion.p variants={fadeUp} className="text-sm font-medium text-clay uppercase tracking-widest mb-4">
                        Automation & Personalization
                    </motion.p>
                    <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl text-ink">
                        It adapts. You don&apos;t have to.
                    </motion.h2>
                    <motion.p variants={fadeUp} className="mt-6 text-lg text-muted max-w-2xl mx-auto">
                        Every recommendation is generated fresh each day based on where you are in your cycle,
                        how you slept, what you ate, and what your body needs right now.
                    </motion.p>
                </motion.div>

                {/* Feature deep-dives */}
                <div className="space-y-24">
                    {/* Workout Automation */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={stagger}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                    >
                        <motion.div variants={fadeUp}>
                            <div className="inline-flex items-center gap-2 rounded-full bg-claySoft/30 px-3 py-1 text-xs font-medium text-clay mb-4">
                                <Dumbbell className="w-3 h-3" /> Workout Engine
                            </div>
                            <h3 className="font-display text-3xl sm:text-4xl text-ink mb-4">
                                Workouts that know your cycle.
                            </h3>
                            <p className="text-base text-muted leading-relaxed mb-6">
                                During your follicular phase, Karigai pushes intensity — HIIT, strength training, new PRs.
                                In your luteal phase, it dials back to yoga, walking, and mobility work. No willpower needed.
                                The system reads your phase and generates the right workout automatically.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Auto-adjusts intensity by cycle phase",
                                    "Considers PCOS, endometriosis, and 30+ conditions",
                                    "Generates fresh routines daily — never repetitive",
                                    "Tracks completion and adapts future plans",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-sm text-ink">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-clay flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div variants={scaleIn}>
                            <FloatingCard className="p-6">
                                <div className="rounded-xl bg-cream/50 p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-claySoft/50 flex items-center justify-center">
                                            <Dumbbell className="w-4 h-4 text-clay" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-ink">Today&apos;s Workout</p>
                                            <p className="text-[10px] text-muted">Follicular Phase · Day 8</p>
                                        </div>
                                        <span className="ml-auto text-[10px] bg-sageSoft/50 text-sage px-2 py-0.5 rounded-full">High Energy</span>
                                    </div>
                                    <div className="space-y-2">
                                        {["Barbell Squats — 4×8", "Romanian Deadlifts — 3×10", "Hip Thrusts — 3×12", "Walking Lunges — 3×10 each"].map((ex) => (
                                            <div key={ex} className="flex items-center gap-2 text-xs text-ink bg-card rounded-lg px-3 py-2 border border-hairline/40">
                                                <span className="w-1 h-1 rounded-full bg-clay" />
                                                {ex}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FloatingCard>
                        </motion.div>
                    </motion.div>

                    {/* Nutrition Personalization */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={stagger}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                    >
                        <motion.div variants={scaleIn} className="order-2 lg:order-1">
                            <FloatingCard className="p-6">
                                <div className="rounded-xl bg-cream/50 p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-sageSoft/50 flex items-center justify-center">
                                            <Utensils className="w-4 h-4 text-sage" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-ink">Meal Suggestion</p>
                                            <p className="text-[10px] text-muted">Luteal Phase · Iron-rich focus</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="bg-card rounded-lg p-3 border border-hairline/40">
                                            <p className="text-xs font-medium text-ink">Lunch</p>
                                            <p className="text-[11px] text-muted mt-1">Spinach & lentil bowl with roasted sweet potato, tahini dressing, and pumpkin seeds</p>
                                            <div className="flex gap-3 mt-2">
                                                <span className="text-[9px] text-clay bg-claySoft/30 px-2 py-0.5 rounded-full">Iron-rich</span>
                                                <span className="text-[9px] text-sage bg-sageSoft/30 px-2 py-0.5 rounded-full">Anti-inflammatory</span>
                                                <span className="text-[9px] text-amber bg-amber/10 px-2 py-0.5 rounded-full">High fibre</span>
                                            </div>
                                        </div>
                                        <div className="bg-card rounded-lg p-3 border border-hairline/40">
                                            <p className="text-xs font-medium text-ink">Snack</p>
                                            <p className="text-[11px] text-muted mt-1">Dark chocolate squares with almonds & chamomile tea</p>
                                            <div className="flex gap-3 mt-2">
                                                <span className="text-[9px] text-clay bg-claySoft/30 px-2 py-0.5 rounded-full">Magnesium</span>
                                                <span className="text-[9px] text-sage bg-sageSoft/30 px-2 py-0.5 rounded-full">Calming</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FloatingCard>
                        </motion.div>
                        <motion.div variants={fadeUp} className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-sageSoft/30 px-3 py-1 text-xs font-medium text-sage mb-4">
                                <Utensils className="w-3 h-3" /> Nutrition Engine
                            </div>
                            <h3 className="font-display text-3xl sm:text-4xl text-ink mb-4">
                                Meals that match your hormones.
                            </h3>
                            <p className="text-base text-muted leading-relaxed mb-6">
                                Karigai suggests meals based on what your body actually needs in each phase.
                                Iron-rich foods before your period. Anti-inflammatory choices during menstruation.
                                Protein-forward meals when you&apos;re building strength. All personalised to your
                                dietary preferences and conditions.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Phase-specific nutrient targeting",
                                    "Respects allergies, intolerances, and preferences",
                                    "Suggests based on what you have available",
                                    "Never prescribes — always suggests with reasoning",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-sm text-ink">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </motion.div>

                    {/* AI Chat & Suggestions */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={stagger}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                    >
                        <motion.div variants={fadeUp}>
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber/10 px-3 py-1 text-xs font-medium text-amber mb-4">
                                <Brain className="w-3 h-3" /> AI Companion
                            </div>
                            <h3 className="font-display text-3xl sm:text-4xl text-ink mb-4">
                                Ask anything. Get real answers.
                            </h3>
                            <p className="text-base text-muted leading-relaxed mb-6">
                                Your AI companion knows your full context — cycle phase, conditions, recent workouts,
                                meals, and energy levels. Ask it anything and get thoughtful, personalised guidance.
                                Not generic internet advice. Real intelligence grounded in your data.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Context-aware responses based on YOUR data",
                                    "Explains the 'why' behind every suggestion",
                                    "Safe language — never diagnoses or prescribes",
                                    "Learns your preferences over time",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-sm text-ink">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div variants={scaleIn}>
                            <FloatingCard className="p-6">
                                <div className="rounded-xl bg-cream/50 p-5 space-y-3">
                                    {/* User message */}
                                    <div className="flex justify-end">
                                        <div className="bg-ink text-paper rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                                            <p className="text-xs">Why am I so tired this week? Should I skip my workout?</p>
                                        </div>
                                    </div>
                                    {/* AI response */}
                                    <div className="flex justify-start">
                                        <div className="bg-card border border-hairline/60 rounded-2xl rounded-bl-md px-4 py-3 max-w-[90%]">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Sparkles className="w-3 h-3 text-clay" />
                                                <span className="text-[10px] font-medium text-clay">karigai</span>
                                            </div>
                                            <p className="text-xs text-ink leading-relaxed">
                                                You&apos;re on day 24 — deep in your luteal phase. Progesterone is peaking, which
                                                often brings fatigue. Based on your pattern, this is normal for you.
                                            </p>
                                            <p className="text-xs text-ink leading-relaxed mt-2">
                                                I&apos;d suggest a gentle 20-min walk or restorative yoga instead of skipping entirely.
                                                Movement may actually help with the sluggishness.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </FloatingCard>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/* ─── Features Grid ─── */
const features = [
    {
        icon: Activity,
        title: "Cycle Intelligence",
        description: "Tracks all 4 phases and adapts everything — workouts, meals, recovery — to where you are right now.",
        color: "text-clay",
        bg: "bg-claySoft/30",
    },
    {
        icon: Dumbbell,
        title: "Adaptive Workouts",
        description: "AI-generated exercise plans that shift intensity based on your energy, phase, and conditions.",
        color: "text-sage",
        bg: "bg-sageSoft/30",
    },
    {
        icon: Utensils,
        title: "Smart Nutrition",
        description: "Phase-aligned meal suggestions with nutrient targeting — not generic calorie counting.",
        color: "text-amber",
        bg: "bg-amber/10",
    },
    {
        icon: Brain,
        title: "AI Companion",
        description: "Ask anything. Get condition-aware, context-rich answers grounded in your personal data.",
        color: "text-clay",
        bg: "bg-claySoft/30",
    },
    {
        icon: Moon,
        title: "Recovery Protocols",
        description: "Knows when to push and when to rest. Suggests recovery based on sleep, stress, and timing.",
        color: "text-sage",
        bg: "bg-sageSoft/30",
    },
    {
        icon: TrendingUp,
        title: "Pattern Recognition",
        description: "Connects cycle, energy, workouts, and nutrition into visual insights over weeks and months.",
        color: "text-amber",
        bg: "bg-amber/10",
    },
    {
        icon: Calendar,
        title: "Cycle Predictions",
        description: "Learns your unique rhythm and predicts upcoming phases, PMS windows, and energy shifts.",
        color: "text-blush",
        bg: "bg-blush/20",
    },
    {
        icon: Target,
        title: "Goal Tracking",
        description: "Set wellness goals and watch Karigai adapt your daily plan to keep you on track.",
        color: "text-clay",
        bg: "bg-claySoft/30",
    },
    {
        icon: Waves,
        title: "Condition Awareness",
        description: "PCOS, endometriosis, thyroid issues, and 30+ conditions shape every recommendation.",
        color: "text-sage",
        bg: "bg-sageSoft/30",
    },
];

function FeaturesSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startAutoSlide = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % features.length);
        }, 3500);
    };

    useEffect(() => {
        startAutoSlide();
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goTo = (i: number) => {
        setActiveIndex(i);
        startAutoSlide();
    };

    const prev = () => goTo(activeIndex === 0 ? features.length - 1 : activeIndex - 1);
    const next = () => goTo((activeIndex + 1) % features.length);

    return (
        <section id="features" className="relative py-32 px-6 bg-cream overflow-hidden">
            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                    className="text-center mb-16"
                >
                    <motion.p variants={fadeUp} className="text-sm font-medium text-clay uppercase tracking-widest mb-4">
                        Features
                    </motion.p>
                    <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl text-ink">
                        Built for how you actually live.
                    </motion.h2>
                    <motion.p variants={fadeUp} className="mt-6 text-lg text-muted max-w-2xl mx-auto">
                        Not another generic fitness app. Karigai understands that your body changes
                        throughout the month — and adapts with you.
                    </motion.p>
                </motion.div>

                {/* Horizontal sliding deck */}
                <div className="relative max-w-3xl mx-auto">
                    {/* Stacked background cards for depth */}
                    <div className="absolute inset-x-0 top-4 bottom-4 flex items-center justify-center pointer-events-none">
                        <div className="w-[94%] h-full rounded-[18px] bg-card/30 border border-hairline/20 translate-y-3 scale-[0.94]" />
                    </div>
                    <div className="absolute inset-x-0 top-2 bottom-2 flex items-center justify-center pointer-events-none">
                        <div className="w-[97%] h-full rounded-[18px] bg-card/50 border border-hairline/30 translate-y-1.5 scale-[0.97]" />
                    </div>

                    {/* Sliding cards container */}
                    <div className="relative overflow-hidden rounded-[18px]">
                        <motion.div
                            className="flex"
                            animate={{ x: `-${activeIndex * 100}%` }}
                            transition={{ type: "spring", stiffness: 200, damping: 30 }}
                        >
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="w-full flex-shrink-0 px-2"
                                >
                                    <div className="rounded-[18px] bg-card border border-hairline/50 shadow-lg shadow-ink/[0.03] p-8 sm:p-10">
                                        <div className="flex items-center gap-5">
                                            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center`}>
                                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-medium text-ink mb-1.5">{feature.title}</h3>
                                                <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Navigation: arrows + dots */}
                    <div className="flex items-center justify-center gap-5 mt-8">
                        <button
                            onClick={prev}
                            className="w-9 h-9 rounded-full border border-bone bg-card flex items-center justify-center hover:bg-shell transition-colors"
                            aria-label="Previous feature"
                        >
                            <ArrowRight className="w-3.5 h-3.5 text-ink rotate-180" />
                        </button>

                        <div className="flex items-center gap-1.5">
                            {features.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goTo(i)}
                                    className="p-0.5"
                                    aria-label={`Feature ${i + 1}`}
                                >
                                    <div
                                        className={`rounded-full transition-all duration-300 ${i === activeIndex
                                                ? "w-3 h-3 bg-clay"
                                                : "w-2 h-2 bg-bone hover:bg-muted"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={next}
                            className="w-9 h-9 rounded-full border border-bone bg-card flex items-center justify-center hover:bg-shell transition-colors"
                            aria-label="Next feature"
                        >
                            <ArrowRight className="w-3.5 h-3.5 text-ink" />
                        </button>
                    </div>

                    {/* Counter */}
                    <div className="text-center mt-3">
                        <span className="font-mono text-[11px] text-muted/60">
                            {String(activeIndex + 1).padStart(2, "0")} / {String(features.length).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── Intelligence / Dark Section ─── */
function IntelligenceSection() {
    return (
        <section id="intelligence" className="relative py-32 px-6 bg-ink overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-clay/8 blur-[150px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-sage/5 blur-[120px] pointer-events-none" />

            <div className="relative mx-auto max-w-6xl">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                    className="text-center mb-16"
                >
                    <motion.p variants={fadeUp} className="text-sm font-medium text-clay uppercase tracking-widest mb-4">
                        Intelligence Engine
                    </motion.p>
                    <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl text-paper">
                        Not just tracking.
                        <br />
                        <span className="italic text-claySoft">Understanding.</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} className="mt-8 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                        Powered by advanced AI that connects the dots between your cycle, conditions,
                        energy levels, and goals. Karigai doesn&apos;t just record — it reasons, predicts, and adapts.
                    </motion.p>
                </motion.div>

                {/* Intelligence features */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={stagger}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
                >
                    {[
                        {
                            icon: MessageCircle,
                            title: "Conversational AI",
                            description: "Chat naturally about your wellness. Get answers that reference your actual data and history.",
                        },
                        {
                            icon: Zap,
                            title: "Real-time Adaptation",
                            description: "Every day is different. Karigai regenerates your plan each morning based on latest signals.",
                        },
                        {
                            icon: Activity,
                            title: "Predictive Insights",
                            description: "Anticipates energy dips, PMS symptoms, and optimal training windows before they happen.",
                        },
                    ].map((item) => (
                        <motion.div
                            key={item.title}
                            variants={fadeUp}
                            className="rounded-[20px] border border-inkLine/30 bg-inkSurf/50 backdrop-blur p-8"
                        >
                            <item.icon className="w-5 h-5 text-clay mb-4" />
                            <h3 className="text-base font-medium text-paper mb-2">{item.title}</h3>
                            <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={stagger}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-12 border-t border-inkLine/20"
                >
                    {[
                        { value: "4", label: "Cycle phases" },
                        { value: "30+", label: "Conditions" },
                        { value: "24/7", label: "Adaptation" },
                        { value: "100%", label: "Private" },
                    ].map((stat) => (
                        <motion.div key={stat.label} variants={fadeUp} className="text-center">
                            <div className="font-display text-4xl text-paper mb-1">{stat.value}</div>
                            <div className="text-xs text-muted">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* ─── How It Works ─── */
const steps = [
    {
        number: "01",
        title: "Share your story",
        description: "Tell us about your conditions, goals, cycle history, and preferences. Everything is optional — skip anything you want.",
        icon: Heart,
    },
    {
        number: "02",
        title: "We map your rhythm",
        description: "Karigai builds a personal wellness model from your cycle phases, energy patterns, and health context.",
        icon: Waves,
    },
    {
        number: "03",
        title: "Get daily intelligence",
        description: "Wake up to workouts, meals, and insights tailored to exactly where you are today. Fresh every morning.",
        icon: Sparkles,
    },
    {
        number: "04",
        title: "Evolve together",
        description: "The more you use Karigai, the smarter it gets. Your patterns refine. Your recommendations sharpen.",
        icon: TrendingUp,
    },
];

function HowItWorksSection() {
    return (
        <section className="relative py-32 px-6">
            <div className="mx-auto max-w-5xl">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                    className="text-center mb-20"
                >
                    <motion.p variants={fadeUp} className="text-sm font-medium text-clay uppercase tracking-widest mb-4">
                        How it works
                    </motion.p>
                    <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl text-ink">
                        Simple to start.
                        <br />
                        Powerful over time.
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={stagger}
                    className="space-y-0"
                >
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.number}
                            variants={fadeUp}
                            className="relative flex gap-6 sm:gap-8 py-10 border-b border-hairline last:border-0"
                        >
                            <div className="flex-shrink-0 flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-shell flex items-center justify-center">
                                    <step.icon className="w-5 h-5 text-clay" />
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="w-px flex-1 bg-hairline mt-3" />
                                )}
                            </div>
                            <div className="flex-1 pt-2">
                                <span className="font-mono text-xs text-muted">{step.number}</span>
                                <h3 className="text-xl sm:text-2xl font-medium text-ink mt-1 mb-2">{step.title}</h3>
                                <p className="text-base text-muted leading-relaxed max-w-lg">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

/* ─── Privacy Section ─── */
function PrivacySection() {
    return (
        <section id="privacy" className="relative py-32 px-6 bg-cream">
            <div className="mx-auto max-w-4xl text-center">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                >
                    <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sageSoft/40 mb-8">
                        <Shield className="w-7 h-7 text-sage" />
                    </motion.div>
                    <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl text-ink">
                        Your body, your data.
                    </motion.h2>
                    <motion.p variants={fadeUp} className="mt-8 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                        Health data is deeply personal. Karigai uses row-level security — your data
                        is encrypted, isolated, and never shared. We don&apos;t sell data. We don&apos;t run ads.
                        We build trust.
                    </motion.p>
                    <motion.div variants={fadeUp} className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: Heart, label: "End-to-end encryption", desc: "Your data is encrypted at rest and in transit" },
                            { icon: Shield, label: "Row-level security", desc: "Database isolation ensures only you see your data" },
                            { icon: Activity, label: "No third-party tracking", desc: "Zero analytics trackers, no ad networks, no data brokers" },
                        ].map((item) => (
                            <div key={item.label} className="rounded-[16px] bg-card border border-hairline/60 p-6 text-center">
                                <item.icon className="w-5 h-5 text-sage mx-auto mb-3" />
                                <p className="text-sm font-medium text-ink mb-1">{item.label}</p>
                                <p className="text-xs text-muted">{item.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

/* ─── CTA Section ─── */
function CTASection() {
    return (
        <section className="relative py-32 px-6 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-paper via-cream/50 to-paper pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-claySoft/15 blur-[120px] pointer-events-none" />

            <div className="relative mx-auto max-w-4xl text-center">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={stagger}
                >
                    <motion.h2 variants={fadeUp} className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-ink">
                        Ready to listen to
                        <br />
                        <span className="italic text-clay">your body?</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} className="mt-6 text-lg text-muted max-w-xl mx-auto">
                        Join women who are done with one-size-fits-all wellness.
                        Start with Karigai today — it&apos;s free.
                    </motion.p>
                    <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/dashboard"
                            className="group inline-flex items-center gap-2 rounded-full bg-ink text-paper px-10 py-5 text-lg font-medium hover:bg-ink2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Get started free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </motion.div>
                    <motion.p variants={fadeUp} className="mt-4 text-xs text-muted/60">
                        No credit card required · Setup takes 2 minutes
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
}

/* ─── Footer ─── */
function Footer() {
    return (
        <footer className="border-t border-hairline py-12 px-6">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <Image src="/karigai-logo.png" alt="karigai" width={24} height={24} className="rounded-md" />
                    <span className="font-display text-base text-ink">karigai</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted">
                    <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
                    <Link href="/about" className="hover:text-ink transition-colors">About</Link>
                    <a href="mailto:hello@karigai.com" className="hover:text-ink transition-colors">Contact</a>
                </div>
                <p className="text-xs text-muted/60">
                    © {new Date().getFullYear()} Karigai. Wellness intelligence for women.
                </p>
            </div>
        </footer>
    );
}

/* ─── Main Export ─── */
export default function LandingPage() {
    return (
        <main className="relative cursor-none">
            <CustomCursor />
            <Navbar />
            <HeroSection />
            <DashboardShowcase />
            <AnalyticsSection />
            <AutomationSection />
            <FeaturesSection />
            <IntelligenceSection />
            <HowItWorksSection />
            <PrivacySection />
            <CTASection />
            <Footer />
        </main>
    );
}
