"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Play, Pause, RotateCcw, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { useTodos, useSaveTimerSession } from "@/hooks/useTodos"
import { notifyTimerComplete } from "@/hooks/use-notifications"

type TimerMode = "work" | "shortBreak" | "longBreak"

interface FocusModeProps {
  isOpen: boolean
  onClose: () => void
  initialTodoId?: string
}

export default function FocusMode({ isOpen, onClose, initialTodoId }: FocusModeProps) {
  const { data: todos = [] } = useTodos()
  const saveTimerSession = useSaveTimerSession()

  const [selectedTodoId, setSelectedTodoId] = useState(initialTodoId || "")
  const [mode, setMode] = useState<TimerMode>("work")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const sessionStartRef = useRef<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const durations = useMemo(() => ({
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  }), [])

  const activeTodos = todos.filter((todo) => !todo.isCompleted)
  const selectedTodo = todos.find((t) => t.id === selectedTodoId)

  useEffect(() => {
    if (initialTodoId) setSelectedTodoId(initialTodoId)
  }, [initialTodoId])

  const handleSessionComplete = useCallback(async (completedMode: TimerMode) => {
    notifyTimerComplete(completedMode)

    if (completedMode === "work" && selectedTodoId && sessionStartRef.current) {
      const endedAt = new Date()
      try {
        await saveTimerSession.mutateAsync({
          todoId: selectedTodoId,
          startedAt: sessionStartRef.current.toISOString(),
          endedAt: endedAt.toISOString(),
          duration: durations.work,
        })
      } catch {
        // silently fail — session still counted locally
      }
      sessionStartRef.current = null
    }
  }, [selectedTodoId, saveTimerSession, durations.work])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)

      if (timeLeft === 0 && isRunning) {
        setIsRunning(false)
        if (mode === "work") {
          setSessions((prev) => prev + 1)
          handleSessionComplete("work")
          const nextMode = sessions > 0 && (sessions + 1) % 4 === 0 ? "longBreak" : "shortBreak"
          setMode(nextMode)
          setTimeLeft(durations[nextMode])
        } else {
          handleSessionComplete(mode)
          setMode("work")
          setTimeLeft(durations.work)
        }
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft, mode, sessions, durations, handleSessionComplete])

  // Keyboard shortcuts in focus mode
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === " ") {
        e.preventDefault()
        setIsRunning((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    if (!sessionStartRef.current && mode === "work") {
      sessionStartRef.current = new Date()
    }
    setIsRunning(true)
  }
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(durations[mode])
    sessionStartRef.current = null
  }
  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode)
    setTimeLeft(durations[newMode])
    setIsRunning(false)
    sessionStartRef.current = null
  }

  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      <Button
        variant="ghost"
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="text-center space-y-8 max-w-lg w-full px-6">
        {/* Task label */}
        {selectedTodo && (
          <div className="text-white/80 text-lg font-medium">
            {selectedTodo.title}
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-3 justify-center">
          {(["work", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                mode === m
                  ? "bg-[var(--accent1bg)] text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {m === "work" ? "Focus" : m === "shortBreak" ? "Short Break" : "Long Break"}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div className="relative w-64 h-64 mx-auto">
          <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="var(--accent1bg)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-bold text-white tracking-wider">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={isRunning ? handlePause : handleStart}
            size="lg"
            className="bg-[var(--accent1bg)] hover:bg-[var(--accent1bg)]/90 text-white px-8 py-6 rounded-full"
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="border-white/20 text-white hover:bg-white/10 bg-transparent rounded-full px-8 py-6"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>

        {/* Task selector */}
        {activeTodos.length > 0 && (
          <div className="max-w-xs mx-auto">
            <Select value={selectedTodoId} onValueChange={setSelectedTodoId}>
              <SelectTrigger className="border-white/20 bg-white/5 text-white">
                <SelectValue placeholder="Select a task to focus on" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/20">
                {activeTodos.map((todo) => (
                  <SelectItem
                    key={todo.id}
                    value={todo.id}
                    className="text-white focus:bg-white/10"
                  >
                    {todo.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Session counter & shortcuts hint */}
        <div className="space-y-2">
          <div className="text-white/40 text-sm">
            Sessions completed: {sessions}
          </div>
          <div className="text-white/20 text-xs">
            Space to play/pause · Esc to exit
          </div>
        </div>
      </div>
    </div>
  )
}
