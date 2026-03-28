"use client"

import { useMemo } from "react"
import { Clock, TrendingDown, TrendingUp, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { useTodos } from "@/hooks/useTodos"
import { Progress } from "@/app/components/ui/progress"

export default function TimeInsights() {
  const { data: todos = [] } = useTodos()

  const insights = useMemo(() => {
    const completedWithTime = todos.filter(
      (t) => t.isCompleted && t.estimatedTime && t.estimatedTime > 0 && (t.timeSpent ?? 0) > 0
    )

    if (completedWithTime.length === 0) {
      return { tasks: [], avgAccuracy: 0, overEstimated: 0, underEstimated: 0, onTarget: 0 }
    }

    const tasks = completedWithTime.map((t) => {
      const estimated = t.estimatedTime!
      const actual = Math.round((t.timeSpent ?? 0) / 60) // timeSpent is in seconds
      const accuracy = estimated > 0 ? Math.round((actual / estimated) * 100) : 0
      return { id: t.id, title: t.title, estimated, actual, accuracy, priority: t.priority }
    })

    const avgAccuracy = Math.round(tasks.reduce((s, t) => s + t.accuracy, 0) / tasks.length)
    const overEstimated = tasks.filter((t) => t.accuracy < 80).length
    const underEstimated = tasks.filter((t) => t.accuracy > 120).length
    const onTarget = tasks.filter((t) => t.accuracy >= 80 && t.accuracy <= 120).length

    return { tasks: tasks.slice(0, 10), avgAccuracy, overEstimated, underEstimated, onTarget }
  }, [todos])

  return (
    <Card className="bg-[var(--primarybg)] dark:bg-[var(--primarybgdark)] border-[var(--secondarybg)]">
      <CardHeader className="pb-4">
        <CardTitle className="text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--accent1bg)]" />
          Time Estimation Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {insights.tasks.length === 0 ? (
          <p className="text-sm text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)] text-center py-6">
            Complete tasks with estimated times and use the focus timer to see insights here.
          </p>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <div className="text-xl font-bold text-green-600">{insights.onTarget}</div>
                <div className="text-xs text-green-600/80">On Target</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                <div className="text-xl font-bold text-blue-600">{insights.overEstimated}</div>
                <div className="text-xs text-blue-600/80">Over-estimated</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <div className="text-xl font-bold text-red-600">{insights.underEstimated}</div>
                <div className="text-xs text-red-600/80">Under-estimated</div>
              </div>
            </div>

            {/* Average accuracy */}
            <div className="p-3 rounded-lg bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]">
                  Average Accuracy
                </span>
                <span className="text-sm font-bold text-[var(--accent1bg)]">
                  {insights.avgAccuracy}%
                </span>
              </div>
              <Progress
                value={Math.min(insights.avgAccuracy, 100)}
                className="h-2"
              />
            </div>

            {/* Task breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]">
                Recent Tasks
              </h4>
              {insights.tasks.map((task) => {
                const Icon = task.accuracy < 80
                  ? TrendingDown
                  : task.accuracy > 120
                    ? TrendingUp
                    : Minus
                const color = task.accuracy < 80
                  ? "text-blue-500"
                  : task.accuracy > 120
                    ? "text-red-500"
                    : "text-green-500"

                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-[var(--secondarybg)]/50 dark:bg-[var(--secondarybgdark)]/50"
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                    <span className="flex-1 text-sm text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] truncate">
                      {task.title}
                    </span>
                    <div className="text-xs text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)] whitespace-nowrap">
                      {task.estimated}m est · {task.actual}m actual
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
