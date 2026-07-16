import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeroCourseCard } from "@/components/practice/HeroCourseCard";
import { CustomTextButton } from "@/components/practice/CustomTextButton";
import { QuickDrillsList } from "@/components/practice/QuickDrillsList";
import { AiConversationCard } from "@/components/practice/AiConversationCard";
import { SkeletonBlock } from "@/components/feedback/SkeletonBlock";
import { listLessonsByCategory } from "@/lib/lessons.functions";
import { HERO_COURSE, APP_NAME } from "@/config/constants";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: `Practice — ${APP_NAME}` },
      { name: "description", content: "Continue your French phonetics course or jump into a quick drill." },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["lessons", HERO_COURSE.category],
    queryFn: () => listLessonsByCategory({ data: { category: HERO_COURSE.category } }),
    staleTime: 60_000,
  });

  const firstLesson = data?.[0];
  // Progress is unknown until auth+attempts wire up; show a friendly 15% placeholder
  // that will be replaced by real per-user progress once signed in.
  const progress = 0.15;

  return (
    <main className="flex-1 px-4 pt-8 pb-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Practice
        </p>
        <h1 className="text-3xl font-bold">
          <span className="text-gradient-neon">Bonjour</span> — let's train.
        </h1>
      </header>

      {isLoading || !firstLesson ? (
        <SkeletonBlock className="h-52 w-full" />
      ) : (
        <HeroCourseCard
          progress={progress}
          continueTo={`/lesson/${firstLesson.id}`}
        />
      )}

      <CustomTextButton />

      <QuickDrillsList />

      <AiConversationCard />
    </main>
  );
}
