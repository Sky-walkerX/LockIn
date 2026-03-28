"use client";

import { useCallback, useEffect, useRef } from "react";

export function useNotifications() {
  const permissionRef = useRef<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;

    if (Notification.permission === "granted") {
      permissionRef.current = "granted";
      return true;
    }

    if (Notification.permission === "denied") return false;

    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result === "granted";
  }, []);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permissionRef.current !== "granted") return;

      try {
        new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });
      } catch {
        // Silently fail if notification fails
      }
    },
    [],
  );

  const notifyTimerComplete = useCallback(
    (mode: "work" | "shortBreak" | "longBreak") => {
      const messages = {
        work: { title: "Focus Session Complete!", body: "Great work! Time for a break." },
        shortBreak: { title: "Break Over!", body: "Ready to get back to work?" },
        longBreak: { title: "Long Break Over!", body: "Feeling refreshed? Let's go!" },
      };
      const msg = messages[mode];
      notify(msg.title, { body: msg.body, tag: "timer" });
    },
    [notify],
  );

  const notifyDueSoon = useCallback(
    (taskTitle: string) => {
      notify("Task Due Soon!", {
        body: `"${taskTitle}" is due in 15 minutes`,
        tag: `due-${taskTitle}`,
      });
    },
    [notify],
  );

  const notifyStreakReminder = useCallback(() => {
    notify("Don't Break Your Streak!", {
      body: "Complete a task today to keep your streak alive!",
      tag: "streak",
    });
  }, [notify]);

  return {
    requestPermission,
    notify,
    notifyTimerComplete,
    notifyDueSoon,
    notifyStreakReminder,
    isSupported: typeof window !== "undefined" && "Notification" in window,
  };
}

// Standalone helpers for use outside React components
function sendNotification(title: string, body: string, tag: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag, icon: "/favicon.ico" });
  } catch {
    // silently fail
  }
}

export function notifyTimerComplete(mode: "work" | "shortBreak" | "longBreak") {
  const messages = {
    work: { title: "Focus Session Complete!", body: "Great work! Time for a break." },
    shortBreak: { title: "Break Over!", body: "Ready to get back to work?" },
    longBreak: { title: "Long Break Over!", body: "Feeling refreshed? Let's go!" },
  };
  const msg = messages[mode];
  sendNotification(msg.title, msg.body, "timer");
}
