import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { HERO_COURSE } from "@/config/constants";
import { ProgressBar } from "@/components/progress/ProgressBar";

interface HeroCourseCardProps {
  progress: number; // 0..1
  continueTo: string;
}

export function HeroCourseCard({ progress, continueTo }: HeroCourseCardProps) {
  return (
    <section
      aria-label="Featured course"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-hero p-5 text-primary-foreground shadow-neon"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" aria-hidden />
      <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-90">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Featured Course
      </div>
      <h2 className="relative mt-2 text-2xl font-bold leading-tight">{HERO_COURSE.title}</h2>
      <p className="relative mt-1 text-sm opacity-90">{HERO_COURSE.subtitle}</p>

      <div className="relative mt-5">
        <ProgressBar value={progress} label="Course progress" />
      </div>

      <Link
        to={continueTo}
        className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-foreground px-5 py-3 text-sm font-bold uppercase tracking-wider text-primary transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        Continue
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
