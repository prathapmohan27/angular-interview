import { Injectable, signal, computed } from '@angular/core';
import { SYSTEM_DESIGN_SYSTEMS, SystemDesignSystem } from './system-design-data';

const PROGRESS_KEY = 'sd_progress'; // { [systemId]: { [sectionId]: true } }

@Injectable({ providedIn: 'root' })
export class SystemDesignService {
  private _progress = signal<Record<string, Record<string, boolean>>>(this.loadProgress());

  readonly systems = SYSTEM_DESIGN_SYSTEMS;

  readonly overallRead = computed(() => {
    let total = 0,
      read = 0;
    for (const sys of this.systems) {
      const p = this._progress()[sys.id] ?? {};
      total += sys.sections.length;
      read += Object.values(p).filter(Boolean).length;
    }
    return { total, read, percent: total ? Math.round((read / total) * 100) : 0 };
  });

  getSystem(id: string): SystemDesignSystem | undefined {
    return this.systems.find((s) => s.id === id);
  }

  systemProgress(systemId: string): { total: number; read: number; percent: number } {
    const sys = this.getSystem(systemId);
    if (!sys) return { total: 0, read: 0, percent: 0 };
    const p = this._progress()[systemId] ?? {};
    const total = sys.sections.length;
    const read = Object.values(p).filter(Boolean).length;
    return { total, read, percent: total ? Math.round((read / total) * 100) : 0 };
  }

  isSectionRead(systemId: string, sectionId: string): boolean {
    return this._progress()[systemId]?.[sectionId] === true;
  }

  toggleSection(systemId: string, sectionId: string) {
    const current = this._progress();
    const sysProgress = { ...(current[systemId] ?? {}) };
    sysProgress[sectionId] = !sysProgress[sectionId];
    const updated = { ...current, [systemId]: sysProgress };
    this._progress.set(updated);
    this.saveProgress(updated);
  }

  markAllRead(systemId: string) {
    const sys = this.getSystem(systemId);
    if (!sys) return;
    const sysProgress: Record<string, boolean> = {};
    sys.sections.forEach((s) => (sysProgress[s.id] = true));
    const updated = { ...this._progress(), [systemId]: sysProgress };
    this._progress.set(updated);
    this.saveProgress(updated);
  }

  resetSystem(systemId: string) {
    const updated = { ...this._progress() };
    delete updated[systemId];
    this._progress.set(updated);
    this.saveProgress(updated);
  }

  private loadProgress(): Record<string, Record<string, boolean>> {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}');
    } catch {
      return {};
    }
  }

  private saveProgress(p: Record<string, Record<string, boolean>>) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch {
      return;
    }
  }
}
