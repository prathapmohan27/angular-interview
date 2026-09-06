import { Injectable, signal, computed } from '@angular/core';
import { CORE_CONCEPTS, CoreConcept } from './core-concepts-data';

const PROGRESS_KEY = 'core_concepts_progress'; // { [conceptId]: { [sectionId]: true } }

@Injectable({ providedIn: 'root' })
export class CoreConceptsService {
  private _progress = signal<Record<string, Record<string, boolean>>>(this.loadProgress());

  readonly concepts = CORE_CONCEPTS;

  readonly overallRead = computed(() => {
    let total = 0,
      read = 0;
    for (const concept of this.concepts) {
      const p = this._progress()[concept.id] ?? {};
      total += concept.sections.length;
      read += Object.values(p).filter(Boolean).length;
    }
    return { total, read, percent: total ? Math.round((read / total) * 100) : 0 };
  });

  getConcept(id: string): CoreConcept | undefined {
    return this.concepts.find((c) => c.id === id);
  }

  conceptProgress(conceptId: string): { total: number; read: number; percent: number } {
    const concept = this.getConcept(conceptId);
    if (!concept) return { total: 0, read: 0, percent: 0 };
    const p = this._progress()[conceptId] ?? {};
    const total = concept.sections.length;
    const read = Object.values(p).filter(Boolean).length;
    return { total, read, percent: total ? Math.round((read / total) * 100) : 0 };
  }

  isSectionRead(conceptId: string, sectionId: string): boolean {
    return this._progress()[conceptId]?.[sectionId] === true;
  }

  toggleSection(conceptId: string, sectionId: string) {
    const current = this._progress();
    const conceptProgress = { ...(current[conceptId] ?? {}) };
    conceptProgress[sectionId] = !conceptProgress[sectionId];
    const updated = { ...current, [conceptId]: conceptProgress };
    this._progress.set(updated);
    this.saveProgress(updated);
  }

  markAllRead(conceptId: string) {
    const concept = this.getConcept(conceptId);
    if (!concept) return;
    const conceptProgress: Record<string, boolean> = {};
    concept.sections.forEach((s) => (conceptProgress[s.id] = true));
    const updated = { ...this._progress(), [conceptId]: conceptProgress };
    this._progress.set(updated);
    this.saveProgress(updated);
  }

  resetConcept(conceptId: string) {
    const updated = { ...this._progress() };
    delete updated[conceptId];
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
