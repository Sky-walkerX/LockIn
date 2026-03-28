"use client"

import { useState } from "react"
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, Target, TrendingUp, Lightbulb, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible"
import { useWeeklyReview } from "@/hooks/use-weekly-review"

export default function WeeklyReviewCard() {
  const { review, isLoading, error, generateReview, clearReview } = useWeeklyReview()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Card className="bg-gradient-to-r from-[var(--accent1bg)]/5 to-purple-500/5 border-[var(--accent1bg)]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--accent1bg)]" />
            AI Weekly Review
          </CardTitle>
          <div className="flex gap-2">
            {review && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearReview}
                className="text-[var(--mutedbg)] hover:text-red-500"
              >
                Clear
              </Button>
            )}
            <Button
              onClick={generateReview}
              disabled={isLoading}
              size="sm"
              className="bg-[var(--accent1bg)] hover:bg-[var(--accent1bg)]/90 text-white"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  {review ? "Refresh" : "Generate"}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}

        {!review && !isLoading && !error && (
          <p className="text-sm text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)] text-center py-4">
            Generate an AI-powered review of your past week&apos;s productivity.
          </p>
        )}

        {review && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="space-y-4">
              {/* Summary */}
              <p className="text-sm text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] leading-relaxed">
                {review.summary}
              </p>

              {/* Stats bar */}
              {review.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2 rounded-lg bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)] text-center">
                    <div className="text-lg font-bold text-[var(--accent1bg)]">{review.stats.tasksCompleted}</div>
                    <div className="text-[10px] text-[var(--mutedbg)]">Completed</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)] text-center">
                    <div className="text-lg font-bold text-[var(--accent1bg)]">{review.stats.totalCreated}</div>
                    <div className="text-[10px] text-[var(--mutedbg)]">Created</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)] text-center">
                    <div className="text-lg font-bold text-[var(--accent1bg)]">{review.stats.focusSessions}</div>
                    <div className="text-[10px] text-[var(--mutedbg)]">Sessions</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)] text-center">
                    <div className="text-lg font-bold text-[var(--accent1bg)]">{review.stats.totalCreated > 0 ? Math.round((review.stats.tasksCompleted / review.stats.totalCreated) * 100) : 0}%</div>
                    <div className="text-[10px] text-[var(--mutedbg)]">Rate</div>
                  </div>
                </div>
              )}

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full text-[var(--mutedbg)]">
                  {isOpen ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" /> Show more
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-4">
                {/* Accomplishments */}
                {review.accomplishments?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] flex items-center gap-1 mb-2">
                      <Target className="w-4 h-4 text-green-500" /> Accomplishments
                    </h4>
                    <ul className="space-y-1">
                      {review.accomplishments.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-[var(--accent2bg)]/80 dark:text-[var(--accent2bgdark)]/80 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-green-500">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Patterns */}
                {review.patterns?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] flex items-center gap-1 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> Patterns
                    </h4>
                    <ul className="space-y-1">
                      {review.patterns.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-[var(--accent2bg)]/80 dark:text-[var(--accent2bgdark)]/80 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-blue-500">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {review.suggestionsForNextWeek?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] flex items-center gap-1 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" /> Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {review.suggestionsForNextWeek.map((item: string, i: number) => (
                        <li key={i} className="text-sm text-[var(--accent2bg)]/80 dark:text-[var(--accent2bgdark)]/80 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-yellow-500">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Motivational note */}
                {review.motivationalNote && (
                  <div className="p-3 rounded-lg bg-[var(--accent1bg)]/10 border border-[var(--accent1bg)]/20">
                    <div className="flex items-start gap-2">
                      <Flame className="w-4 h-4 text-[var(--accent1bg)] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] italic">
                        {review.motivationalNote}
                      </p>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}
