import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getModuleById, QUICK_DRILL_MODULES } from "@/config/modules";
import { listLessonsByCategory } from "@/lib/lessons.functions";
import { SkeletonBlock } from "@/components/feedback/SkeletonBlock";
import { APP_NAME } from "@/config/constants";

export const Route = createFileRoute("/module/$moduleId")({
  beforeLoad: ({ params }) => {
    if (!getModuleById(params.moduleId)) {
      throw redirect({ to: "/practice" });
    }
  },
  head: ({ params }) => {
    const mod = getModuleById(params.moduleId);
    return {
      meta: [
        { title: `${mod?.title ?? "Module"} — ${APP_NAME}` },
        { name: "description", content: mod?.subtitle ?? "French pronunciation drill." },
      ],
    };
  },
  component: ModulePage,
});

function ModulePage() {
  const { moduleId } = Route.useParams();
  const mod = getModuleById(moduleId) ?? QUICK_DRILL_MODULES[0];

  const { data, isLoading } = useQuery({
    queryKey: ["lessons", mod.category],
    queryFn: () => listLessonsByCategory({ data: { category: mod.category } }),
    staleTime: 60_000,
  });

  return (
    <main className="flex-1 px-4 pt-6 pb-6 space-y-5">
      <Link
        to="/practice"
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Practice
      </Link>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quick Drill
        </p>
        <h1 className="text-3xl font-bold">
          <span className="mr-2">{mod.emoji}</span>
          {mod.title}
        </h1>
        <p className="text-sm text-muted-foreground">{mod.subtitle}</p>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
        </div>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-surface">
          {(data ?? []).map((lesson, index) => (
            <li key={lesson.id}>
              <Link
                to="/lesson/$lessonId"
                params={{ lessonId: lesson.id }}
                className="group flex items-center gap-4 p-4 transition-colors hover:bg-surface-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {lesson.french_text}
                  </p>
                </div>
                <ChevronRight
                  className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
