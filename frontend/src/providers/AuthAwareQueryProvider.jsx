
import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { supabase } from "../lib/supabaseClient";
import { createUserPersister } from "../lib/queryPersister";

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: CACHE_DURATION,
    },
  },
});

export default function AuthAwareQueryProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let previousUserId = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;

      if (previousUserId !== nextUserId) {
        queryClient.clear();

        if (previousUserId) {
          createUserPersister(previousUserId)
            .removeClient()
            .catch((error) => {
              console.error("Failed to clear previous user cache:", error);
            });
        }

        previousUserId = nextUserId;
      }

      setUserId(nextUserId);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading EduTrack...
      </div>
    );
  }

  // Guests should not have a persisted academic-data cache.
  if (!userId) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      key={userId}
      client={queryClient}
      persistOptions={{
        persister: createUserPersister(userId),
        maxAge: CACHE_DURATION,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" &&
            [
              "current-user",
              "levels",
              "semesters",
              "courses",
              "dashboard-cgpa",
              "profile",
            ].includes(query.queryKey[0]),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
