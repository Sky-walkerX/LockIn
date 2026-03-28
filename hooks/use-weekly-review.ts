"use client";

import { useState } from "react";

export interface WeeklyReview {
  summary: string;
  accomplishments: string[];
  patterns: string[];
  suggestionsForNextWeek: string[];
  focusAreas: string[];
  motivationalNote: string;
  stats: {
    tasksCompleted: number;
    tasksMissed: number;
    totalCreated: number;
    focusSessions: number;
    focusHours: number;
    streak: number;
    level: number;
    xp: number;
  };
}

export function useWeeklyReview() {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/weekly-review", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to generate weekly review");
      }

      const data = await response.json();
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate weekly review");
    } finally {
      setIsLoading(false);
    }
  };

  const clearReview = () => {
    setReview(null);
    setError(null);
  };

  return {
    review,
    isLoading,
    error,
    generateReview,
    clearReview,
  };
}
