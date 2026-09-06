import { Injectable, signal, computed } from '@angular/core';
import { CategoryModel } from './question';

export type LearningMode = 'single' | 'mixed' | 'random';

export interface DailyQuestion {
  text: string;
  categoryId: string;
  categoryTitle: string;
  categoryColor: string;
  categoryIcon: string;
}

export interface DailySession {
  date: string; // YYYY-MM-DD
  mode: LearningMode;
  topicIds: string[];
  questions: DailyQuestion[];
  completed: boolean[]; // per-question completion flags
}

const STORAGE_KEY_PREFIX = 'daily_session_';
const STREAK_KEY = 'daily_streak';
const QUESTIONS_PER_DAY = 10;

@Injectable({ providedIn: 'root' })
export class DailyLearningService {
  private _session = signal<DailySession | null>(null);
  private _streak = signal<number>(0);

  readonly session = this._session.asReadonly();
  readonly streak = this._streak.asReadonly();

  readonly completedCount = computed(() => {
    const s = this._session();
    if (!s) return 0;
    return s.completed.filter(Boolean).length;
  });

  readonly progress = computed(() => {
    const s = this._session();
    if (!s) return 0;
    return Math.round((this.completedCount() / QUESTIONS_PER_DAY) * 100);
  });

  readonly isComplete = computed(() => this.completedCount() >= QUESTIONS_PER_DAY);

  /** Returns today's date as YYYY-MM-DD */
  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Load existing session from localStorage if present */
  loadTodaySession(): DailySession | null {
    try {
      const key = STORAGE_KEY_PREFIX + this.today();
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const session: DailySession = JSON.parse(raw);
      this._session.set(session);
      this._streak.set(this.computeStreak());
      return session;
    } catch {
      return null;
    }
  }

  /** Generate (or regenerate) a new session and persist it */
  generateSession(
    mode: LearningMode,
    allCategories: CategoryModel[],
    topicIds: string[] = [],
  ): DailySession {
    const date = this.today();
    let questions: DailyQuestion[] = [];

    if (mode === 'single') {
      const cat = allCategories.find((c) => c.id === topicIds[0]);
      if (cat) {
        questions = this.pickFromCategory(cat, QUESTIONS_PER_DAY, date);
      }
    } else if (mode === 'mixed') {
      const selected = allCategories.filter((c) => topicIds.includes(c.id));
      questions = this.pickMixed(selected, QUESTIONS_PER_DAY, date);
    } else {
      // random / all topics
      questions = this.pickRandom(allCategories, QUESTIONS_PER_DAY, date);
    }

    const session: DailySession = {
      date,
      mode,
      topicIds,
      questions,
      completed: new Array(questions.length).fill(false),
    };

    this._session.set(session);
    this.persistSession(session);
    this.updateStreak();
    this._streak.set(this.computeStreak());
    return session;
  }

  /** Toggle completion for a question index */
  toggleComplete(index: number) {
    const s = this._session();
    if (!s) return;
    const completed = [...s.completed];
    completed[index] = !completed[index];
    const updated: DailySession = { ...s, completed };
    this._session.set(updated);
    this.persistSession(updated);

    if (updated.completed.every(Boolean)) {
      this.updateStreak();
      this._streak.set(this.computeStreak());
    }
  }

  /** Clear current session so user can pick a new mode */
  clearSession() {
    this._session.set(null);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private persistSession(session: DailySession) {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + session.date, JSON.stringify(session));
    } catch {
      return;
    }
  }

  private pickFromCategory(cat: CategoryModel, count: number, seed: string): DailyQuestion[] {
    const shuffled = this.seededShuffle([...cat.questions], seed + cat.id);
    return shuffled.slice(0, count).map((q) => this.toQuestion(q, cat));
  }

  private pickMixed(categories: CategoryModel[], total: number, seed: string): DailyQuestion[] {
    if (!categories.length) return [];
    const perCat = Math.floor(total / categories.length);
    const remainder = total % categories.length;
    const result: DailyQuestion[] = [];

    categories.forEach((cat, i) => {
      const take = perCat + (i < remainder ? 1 : 0);
      const shuffled = this.seededShuffle([...cat.questions], seed + cat.id);
      shuffled.slice(0, take).forEach((q) => result.push(this.toQuestion(q, cat)));
    });

    return this.seededShuffle(result, seed + 'mixed');
  }

  private pickRandom(categories: CategoryModel[], total: number, seed: string): DailyQuestion[] {
    const pool: DailyQuestion[] = [];
    categories.forEach((cat) => cat.questions.forEach((q) => pool.push(this.toQuestion(q, cat))));
    return this.seededShuffle(pool, seed).slice(0, total);
  }

  private toQuestion(text: string, cat: CategoryModel): DailyQuestion {
    return {
      text,
      categoryId: cat.id,
      categoryTitle: cat.title,
      categoryColor: cat.color,
      categoryIcon: cat.icon,
    };
  }

  /** Simple seeded shuffle using mulberry32 PRNG */
  private seededShuffle<T>(arr: T[], seed: string): T[] {
    let h = this.hashSeed(seed);
    const rand = () => {
      h ^= h << 13;
      h ^= h >> 17;
      h ^= h << 5;
      return (h >>> 0) / 0xffffffff;
    };
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  private hashSeed(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h || 1;
  }

  // ─── Streak helpers ───────────────────────────────────────────────────────

  private updateStreak() {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      const data: { lastDate: string; count: number } = raw
        ? JSON.parse(raw)
        : { lastDate: '', count: 0 };

      const today = this.today();
      const yesterday = this.dateOffset(-1);

      let count = data.count;
      if (data.lastDate === today) {
        // already recorded today — no change
      } else if (data.lastDate === yesterday) {
        count += 1;
      } else {
        count = 1;
      }

      localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count }));
    } catch {
      return;
    }
  }

  private computeStreak(): number {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (!raw) return 0;
      const data: { lastDate: string; count: number } = JSON.parse(raw);
      // Streak is stale if last date isn't today or yesterday
      const validDates = [this.today(), this.dateOffset(-1)];
      return validDates.includes(data.lastDate) ? data.count : 0;
    } catch {
      return 0;
    }
  }

  private dateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
