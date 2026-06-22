/**
 * useLearningProfile — React Query hook for the full learning profile.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getLearningProfile } from "@/lib/masteryService";
import { LearningProfile } from "@shared/coreTypes";

export function useLearningProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<LearningProfile | null>({
    queryKey: ["learningProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return getLearningProfile(user.id, user);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 min cache
    refetchOnWindowFocus: true,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["learningProfile", user?.id] });
  }

  return {
    profile: query.data?.profile ?? null,
    masteryScores: query.data?.masteryScores ?? [],
    weakTopics: query.data?.weakTopics ?? [],
    recentAssessments: query.data?.recentAssessments ?? [],
    isLoading: query.isLoading,
    invalidate,
  };
}
