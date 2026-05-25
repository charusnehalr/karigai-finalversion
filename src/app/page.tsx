import type { Metadata } from "next";
import LandingPage from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "karigai · wellness intelligence for women",
  description:
    "Condition-aware wellness intelligence. Personalised fitness, nutrition, cycle tracking, and daily guidance — designed for the female body.",
};

export default function RootPage() {
  return <LandingPage />;
}
