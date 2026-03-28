"use client"

import { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek,
} from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { useTodos } from "@/hooks/useTodos"

export default function CalendarView() {
  const { status } = useSession()
  const router = useRouter()
  const { data: todos = [], isLoading } = useTodos()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const todosByDate = useMemo(() => {
    const map: Record<string, typeof todos> = {}
    todos.forEach((todo) => {
      if (todo.dueDate) {
        const key = format(new Date(todo.dueDate), "yyyy-MM-dd")
        if (!map[key]) map[key] = []
        map[key].push(todo)
      }
    })
    return map
  }, [todos])

  const selectedDateTodos = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, "yyyy-MM-dd")
    return todosByDate[key] || []
  }, [selectedDate, todosByDate])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-500"
      case "MEDIUM": return "bg-yellow-500"
      case "LOW": return "bg-green-500"
      default: return "bg-gray-400"
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--primarybg)] dark:bg-[var(--primarybgdark)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--accent1bg)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === "unauthenticated") return null

  return (
    <div className="min-h-screen bg-[var(--primarybg)] dark:bg-[var(--primarybgdark)]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--accent1bg)] flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]">Calendar</h1>
            <p className="text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)] text-lg">
              Visualize your tasks across time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="bg-[var(--primarybg)] dark:bg-[var(--primarybgdark)] border-[var(--secondarybg)]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="text-[var(--accent2bg)]"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <CardTitle className="text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="text-[var(--accent2bg)]"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div
                      key={d}
                      className="text-center text-xs font-medium text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)] py-2"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd")
                    const dayTodos = todosByDate[key] || []
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                    const isSelected = selectedDate && isSameDay(day, selectedDate)

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(day)}
                        className={`relative p-2 min-h-[64px] rounded-lg text-left transition-all duration-150 ${
                          !isCurrentMonth
                            ? "opacity-30"
                            : isSelected
                              ? "bg-[var(--accent1bg)]/15 ring-2 ring-[var(--accent1bg)]"
                              : "hover:bg-[var(--secondarybg)] dark:hover:bg-[var(--secondarybgdark)]"
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            isToday(day)
                              ? "bg-[var(--accent1bg)] text-white w-6 h-6 rounded-full flex items-center justify-center"
                              : "text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]"
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        {/* Task dots */}
                        {dayTodos.length > 0 && (
                          <div className="flex gap-0.5 mt-1 flex-wrap">
                            {dayTodos.slice(0, 3).map((todo) => (
                              <div
                                key={todo.id}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  todo.isCompleted ? "bg-green-500" : getPriorityColor(todo.priority)
                                }`}
                              />
                            ))}
                            {dayTodos.length > 3 && (
                              <span className="text-[8px] text-[var(--mutedbg)]">+{dayTodos.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Day Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-[var(--primarybg)] dark:bg-[var(--primarybgdark)] border-[var(--secondarybg)] sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)] text-base">
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
                {!selectedDate ? (
                  <p className="text-sm text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)] text-center py-8">
                    Click on a date to see tasks
                  </p>
                ) : selectedDateTodos.length === 0 ? (
                  <p className="text-sm text-[var(--mutedbg)] dark:text-[var(--mutedbgdark)] text-center py-8">
                    No tasks for this day
                  </p>
                ) : (
                  selectedDateTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-3 rounded-lg ${
                        todo.isCompleted
                          ? "bg-[var(--mutedbg)]/20 opacity-60"
                          : "bg-[var(--secondarybg)] dark:bg-[var(--secondarybgdark)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            todo.isCompleted ? "bg-green-500" : getPriorityColor(todo.priority)
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            todo.isCompleted
                              ? "line-through text-[var(--mutedbg)]"
                              : "text-[var(--accent2bg)] dark:text-[var(--accent2bgdark)]"
                          }`}
                        >
                          {todo.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge
                          className={`text-[10px] ${
                            todo.priority === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : todo.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {todo.priority}
                        </Badge>
                        {todo.estimatedTime && (
                          <span className="text-[10px] text-[var(--mutedbg)]">{todo.estimatedTime}min</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
