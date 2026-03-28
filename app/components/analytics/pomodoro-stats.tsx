"use client"

import { useMemo } from "react"
import { Clock, Timer, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { useTimerSessions } from "@/hooks/useTodos"
import { format, subDays, startOfDay, endOfDay } from "date-fns"

export default function PomodoroStats() {
  const { data: sessions = [] } = useTimerSessions()

  const stats = useMemo(() => {
    const now = new Date()
    const last7Days = subDays(now, 7)

    const recentSessions = sessions.filter(
      (s: { startedAt: string }) => new Date(s.startedAt) >= last7Days
    )

    const totalMinutes = sessions.reduce(
      (sum: number, s: { duration: number }) => sum + Math.round(s.duration / 60),
      0
    )

    const todaySessions = sessions.filter(
      (s: { startedAt: string }) => {
        const d = new Date(s.startedAt)
        return d >= startOfDay(now) && d <= endOfDay(now)
      }
    )

    const todayMinutes = todaySessions.reduce(
      (sum: number, s: { duration: number }) => sum + Math.round(s.duration / 60),
      0
    )

    // Daily breakdown for last 7 days
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i)
      const dayStr = format(day, "yyyy-MM-dd")
      const daySessions = recentSessions.filter(
        (s: { startedAt: string }) => format(new Date(s.startedAt), "yyyy-MM-dd") === dayStr
      )
      return {
        day: format(day, "EEE"),
        sessions: daySessions.length,
        minutes: daySessions.reduce(
          (sum: number, s: { duration: number }) => sum + Math.round(s.duration / 60),
          0
        ),
      }
    })

    return {
      totalSessions: sessions.length,
      totalMinutes,
      todaySessions: todaySessions.length,
      todayMinutes,
      weekSessions: recentSessions.length,
      dailyData,
      avgPerDay: recentSessions.length > 0 ? Math.round(recentSessions.length / 7) : 0,
    }
  }, [sessions])

  return (
    <Card className="bg-[var(--primarybg)] dark:bg-[var(--primarybgdark)] border-[var(--secondarybg)]">
      <CardHeader className="pb-4">
        <CardTitle className="text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] flex items-center gap-2">
          <Timer className="w-5 h-5 text-[var(--accent1bg)]" />
          Focus Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)]">
            <div className="text-2xl font-bold text-[var(--accent1bg)]">{stats.todaySessions}</div>
            <div className="text-xs text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)]">Today</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)]">
            <div className="text-2xl font-bold text-[var(--accent1bg)]">{stats.weekSessions}</div>
            <div className="text-xs text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)]">This Week</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)]">
            <div className="text-2xl font-bold text-[var(--accent1bg)]">{stats.totalSessions}</div>
            <div className="text-xs text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)]">All Time</div>
          </div>
        </div>

        {/* Time stats */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[var(--accent1bg)]/10 to-purple-500/10">
          <Clock className="w-5 h-5 text-[var(--accent1bg)]" />
          <div>
            <div className="text-sm font-medium text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]">
              {stats.todayMinutes} min today · {stats.totalMinutes} min total
            </div>
            <div className="text-xs text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)]">
              ~{stats.avgPerDay} sessions/day average
            </div>
          </div>
        </div>

        {/* Weekly bar chart */}
        <div>
          <h4 className="text-sm font-medium text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent1bg)]" />
            Last 7 Days
          </h4>
          <div className="flex items-end gap-2 h-24">
            {stats.dailyData.map((d, i) => {
              const maxSessions = Math.max(...stats.dailyData.map((x) => x.sessions), 1)
              const height = (d.sessions / maxSessions) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-[var(--mutedbg)]">{d.sessions}</div>
                  <div className="w-full flex items-end justify-center h-16">
                    <div
                      className="w-full bg-[var(--accent1bg)] rounded-t-sm transition-all"
                      style={{ height: `${height}%`, minHeight: d.sessions > 0 ? "4px" : "2px" }}
                    />
                  </div>
                  <div className="text-[10px] text-[var(--mutedbg)]">{d.day}</div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
