// Study streaks from the set of local days (yyyy-MM-dd) with at least one
// completion. Pure so the day-boundary rules are testable.

const DAY_MS = 86_400_000;

// Day keys are calendar dates, not instants, so compare them as UTC midnights:
// that sidesteps DST days that are 23 or 25 hours long in local time.
const toDayNumber = (key: string) => Math.round(Date.parse(`${key}T00:00:00Z`) / DAY_MS);

export function computeStreaks(
  dayKeys: Iterable<string>,
  todayKey: string,
): { current: number; longest: number } {
  const days = [...new Set([...dayKeys].map(toDayNumber))].sort((a, b) => a - b);
  const done = new Set(days);

  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  // A run that ended yesterday is still alive: today isn't over yet.
  const today = toDayNumber(todayKey);
  let day = done.has(today) ? today : today - 1;
  let current = 0;
  while (done.has(day)) {
    current++;
    day--;
  }

  return { current, longest };
}
