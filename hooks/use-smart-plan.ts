"use client"

import { useState } from "react"
import type { Todo } from "@/app/generated/prisma"

export interface SmartPlan {
  reasoning: string
  plan: string[] // Array of task IDs in optimized order
}

export function useSmartPlan() {
  const [plan, setPlan] = useState<SmartPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSmartPlan = async (tasks: Todo[]) => {
    if (tasks.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/smart-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate smart plan")
      }

      const data = await response.json()
      setPlan(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate smart plan")
    } finally {
      setIsLoading(false)
    }
  }

  const applySmartPlan = async () => {
    if (!plan) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/todos/reorder", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: plan.plan }),
      })
      if (!response.ok) {
        throw new Error("Failed to apply smart plan")
      }
      setPlan(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply smart plan")
    } finally {
      setIsLoading(false)
    }
  }

  const clearPlan = () => {
    setPlan(null)
    setError(null)
  }

  return {
    plan,
    isLoading,
    error,
    generateSmartPlan,
    applySmartPlan,
    clearPlan,
  }
}
