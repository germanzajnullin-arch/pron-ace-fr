import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BottomTabBar } from "@/components/nav/BottomTabBar";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/config/constants";
import { useProfile } from "@/hooks/useProfile";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { isOnboardingCompleted, setOnboardingCompleted, ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { useAnswersSync } from "@/hooks/useAnswersSync";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-gradient-neon text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That page doesn't exist. Head back to your practice.
        </p>
        <div className="mt-6">
          <Link
            to="/practice"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            Go to Practice
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again or head back to Practice.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow"
          >
            Try again
          </button>
          <a
            href="/practice"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

const APP_TITLE = `${APP_NAME} — Learn French Pronunciation`;
const APP_DESCRIPTION =
  "Master French pronunciation with real-time speech feedback, nasal vowel drills, minimal-pair training, and AI conversation practice.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a1832" },
      { title: APP_TITLE },
      { name: "description", content: APP_DESCRIPTION },
      { name: "author", content: APP_NAME },
      { property: "og:title", content: APP_TITLE },
      { property: "og:description", content: APP_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Lovable App" },
      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "description", content: "Learn French pronunciation and speaking with this mobile-first web app." },
      { property: "og:description", content: "Learn French pronunciation and speaking with this mobile-first web app." },
      { name: "twitter:description", content: "Learn French pronunciation and speaking with this mobile-first web app." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a48ed4f8-da22-4fa9-9b12-5de479595974/id-preview-ea783832--de4a18ca-c54a-44f4-85a1-55638e16530d.lovable.app-1784165969611.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a48ed4f8-da22-4fa9-9b12-5de479595974/id-preview-ea783832--de4a18ca-c54a-44f4-85a1-55638e16530d.lovable.app-1784165969611.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <OnboardingGate />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function OnboardingGate() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, session, loading } = useProfile();
  useAnswersSync();

  // Read localStorage after mount (SSR-safe) and stay in sync across tabs.
  const [localCompleted, setLocalCompleted] = useState<boolean>(true);
  useEffect(() => {
    setLocalCompleted(isOnboardingCompleted());
    const onStorage = (e: StorageEvent) => {
      if (e.key === ONBOARDING_STORAGE_KEY) {
        setLocalCompleted(isOnboardingCompleted());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  const isPublic = pathname === "/auth" || pathname === "/onboarding";
  // Guest-first: rely on the local flag. DB flag only *upgrades* the local one
  // when the user is signed in — it never forces redirect on its own.
  const needsOnboarding = !localCompleted;

  useEffect(() => {
    if (loading) return;
    // Signed-in user with completed onboarding in DB → mirror locally so the
    // gate doesn't force them back through the quiz on a clean browser.
    if (!!session && !!profile && profile.onboarding_completed) {
      if (!localCompleted) {
        setOnboardingCompleted(true);
        setLocalCompleted(true);
      }
      return;
    }
    if (needsOnboarding && !isPublic) {
      router.navigate({ to: "/onboarding" });
    }
  }, [loading, needsOnboarding, isPublic, router, localCompleted, session, profile]);

  const hideChrome = pathname === "/onboarding" || pathname === "/auth";

  return (
    <>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24">
        <Outlet />
      </div>
      {!hideChrome && <BottomTabBar />}
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
