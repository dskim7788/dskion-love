const STREAK_KEY = "dskion-love:streak";

interface StreakData {
  count: number;
  lastVisitDate: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function registerVisit(): { streak: number; isNewDay: boolean } {
  if (!isBrowser()) return { streak: 1, isNewDay: false };

  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    const today = todayStr();

    if (!raw) {
      const data: StreakData = { count: 1, lastVisitDate: today };
      window.localStorage.setItem(STREAK_KEY, JSON.stringify(data));
      return { streak: 1, isNewDay: true };
    }

    const data: StreakData = JSON.parse(raw);
    if (data.lastVisitDate === today) {
      return { streak: data.count, isNewDay: false };
    }

    const gap = daysBetween(data.lastVisitDate, today);
    const nextCount = gap === 1 ? data.count + 1 : 1;
    const next: StreakData = { count: nextCount, lastVisitDate: today };
    window.localStorage.setItem(STREAK_KEY, JSON.stringify(next));
    return { streak: nextCount, isNewDay: true };
  } catch {
    return { streak: 1, isNewDay: false };
  }
}
