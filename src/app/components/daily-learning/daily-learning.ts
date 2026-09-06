import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DailyLearningService, LearningMode } from '@services/daily-learning';
import { Question, CategoryModel } from '@services/question';

type AppMode = 'angular' | 'nodejs';
type ViewState = 'setup' | 'session';

@Component({
  selector: 'app-daily-learning',
  imports: [RouterLink],
  template: `
    <div class="dl-shell">
      <div class="dl-glow"></div>

      <div class="dl-wrapper">
        <!-- Top bar -->
        <div class="dl-topbar">
          <a routerLink="/" class="btn-back"> <i class="ti ti-arrow-left"></i> Back to PrepHub </a>

          <!-- Streak badge -->
          @if (streak() > 0) {
            <div class="streak-badge">
              <span class="streak-fire">🔥</span>
              {{ streak() }} day{{ streak() === 1 ? '' : 's' }} streak
            </div>
          } @else {
            <div
              class="streak-badge streak-zero"
              style="color: var(--color-text-subtle); background: rgba(63,63,70,.25); border-color: var(--color-border);"
            >
              <i class="ti ti-flame" style="font-size:14px"></i>
              Start your streak today
            </div>
          }
        </div>

        <!-- Page header -->
        <div class="dl-page-header animate-in">
          <div class="dl-page-icon"><i class="ti ti-calendar-stats"></i></div>
          <h1 class="dl-page-title">Daily Learning</h1>
          <p class="dl-page-sub">10 questions · refreshes every day · track your streak</p>
        </div>

        <!-- ── SETUP VIEW ────────────────────────────────────────────────── -->
        @if (view() === 'setup') {
          <!-- App mode toggle (Angular / Node.js) -->
          <div style="margin-bottom: 24px; display: flex; align-items: center; gap: 8px;">
            <span class="mode-section-label" style="margin-bottom: 0">Learning Track:</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <button
                (click)="setAppMode('angular')"
                class="topic-chip"
                [class.topic-chip--active]="appMode() === 'angular'"
                style="border-radius: var(--radius-md);"
              >
                <i class="ti ti-brand-angular" style="font-size:13px; color:#f43f5e"></i>
                Angular
              </button>
              <button
                (click)="setAppMode('nodejs')"
                class="topic-chip"
                [class.topic-chip--active]="appMode() === 'nodejs'"
                style="border-radius: var(--radius-md);"
              >
                <i class="ti ti-brand-nodejs" style="font-size:13px; color:#16a34a"></i>
                Node.js
              </button>
            </div>
          </div>

          <!-- Mode picker -->
          <p class="mode-section-label">Choose your learning mode</p>
          <div class="mode-cards animate-in">
            <!-- Single Topic -->
            <button
              class="mode-card"
              [class.mode-card--active]="selectedMode() === 'single'"
              (click)="selectMode('single')"
              id="mode-single"
            >
              @if (selectedMode() === 'single') {
                <span class="mode-check"><i class="ti ti-check"></i></span>
              }
              <div class="mode-card-icon mode-card-icon--single">
                <i class="ti ti-target-arrow"></i>
              </div>
              <div class="mode-card-title">Single Topic</div>
              <div class="mode-card-desc">
                Focus deeply on one category. All 10 questions from your chosen topic.
              </div>
            </button>

            <!-- Mixed Topics -->
            <button
              class="mode-card"
              [class.mode-card--active]="selectedMode() === 'mixed'"
              (click)="selectMode('mixed')"
              id="mode-mixed"
            >
              @if (selectedMode() === 'mixed') {
                <span class="mode-check"><i class="ti ti-check"></i></span>
              }
              <div class="mode-card-icon mode-card-icon--mixed">
                <i class="ti ti-layers-intersect"></i>
              </div>
              <div class="mode-card-title">Mixed Topics</div>
              <div class="mode-card-desc">
                Pick 2–4 topics. Questions spread evenly across your selection.
              </div>
            </button>

            <!-- Random -->
            <button
              class="mode-card"
              [class.mode-card--active]="selectedMode() === 'random'"
              (click)="selectMode('random')"
              id="mode-random"
            >
              @if (selectedMode() === 'random') {
                <span class="mode-check"><i class="ti ti-check"></i></span>
              }
              <div class="mode-card-icon mode-card-icon--random">
                <i class="ti ti-dice-5"></i>
              </div>
              <div class="mode-card-title">Random / All Topics</div>
              <div class="mode-card-desc">
                Surprise selection from the entire question bank. Same set all day.
              </div>
            </button>
          </div>

          <!-- Topic selector (Single / Mixed) -->
          @if (selectedMode() === 'single' || selectedMode() === 'mixed') {
            <div class="topic-section">
              <p class="mode-section-label">
                {{ selectedMode() === 'single' ? 'Pick a topic' : 'Pick 2–4 topics' }}
              </p>
              <p class="topic-hint">
                {{
                  selectedMode() === 'single'
                    ? 'All 10 questions will be from this category.'
                    : selectedTopics().length + ' selected — questions spread evenly.'
                }}
              </p>
              <div class="topic-chips">
                @for (cat of modeCategories(); track cat.id) {
                  <button
                    class="topic-chip"
                    [class.topic-chip--active]="isTopicSelected(cat.id)"
                    (click)="toggleTopic(cat.id)"
                    [id]="'topic-' + cat.id"
                  >
                    <span class="topic-chip-dot" [style.background]="cat.color"></span>
                    {{ cat.title }}
                    <span style="font-size:0.6rem; color: var(--color-text-faint)"
                      >({{ cat.questions.length }})</span
                    >
                  </button>
                }
              </div>
            </div>
          }

          <!-- Generate CTA -->
          <button
            class="btn-generate"
            [disabled]="!canGenerate()"
            (click)="generate()"
            id="btn-generate-session"
          >
            <i class="ti ti-sparkles"></i>
            Generate Today's Questions
          </button>
        }

        <!-- ── SESSION VIEW ───────────────────────────────────────────────── -->
        @if (view() === 'session' && session()) {
          <div class="animate-in">
            <!-- Session header -->
            <div class="session-header">
              <div class="session-meta">
                <span class="session-date-label">{{ formattedDate() }}</span>
                <span class="session-title">Today's 10 Questions</span>
                <span class="session-mode-tag">
                  <i [class]="'ti ' + modeIcon()"></i>
                  {{ modeLabel() }}
                </span>
              </div>
              <div class="session-actions">
                <button class="btn-restart" (click)="restart()" id="btn-restart">
                  <i class="ti ti-refresh"></i> Change Mode
                </button>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="progress-bar-wrap">
              <div class="progress-row">
                <span class="progress-label">Progress</span>
                <span class="progress-count">{{ completedCount() }} / 10</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width]="progress() + '%'"></div>
              </div>
            </div>

            <!-- Question cards -->
            <div class="questions-list">
              @for (q of session()!.questions; track q.text; let i = $index) {
                <div class="q-card" [class.q-card--done]="session()!.completed[i]">
                  <!-- Card header (click to expand) -->
                  <div
                    class="q-card-header"
                    (click)="toggleExpand(i)"
                    (keydown.enter)="toggleExpand(i)"
                    (keydown.space)="toggleExpand(i); $event.preventDefault()"
                    role="button"
                    tabindex="0"
                    [attr.aria-expanded]="expandedIndex() === i"
                    [id]="'q-card-' + i"
                  >
                    <!-- Number / check -->
                    <div class="q-number" [class.q-number--done]="session()!.completed[i]">
                      @if (session()!.completed[i]) {
                        <i class="ti ti-check"></i>
                      } @else {
                        {{ i + 1 }}
                      }
                    </div>

                    <!-- Question text -->
                    <p class="q-text" [class.q-text--done]="session()!.completed[i]">
                      {{ q.text }}
                    </p>

                    <!-- Category tag -->
                    <span
                      class="q-cat-tag"
                      [style.color]="q.categoryColor"
                      [style.background]="q.categoryColor + '18'"
                      style="border: 1px solid currentColor; border-color: {{ q.categoryColor }}30"
                    >
                      <i [class]="'ti ' + q.categoryIcon" style="font-size:10px"></i>
                      {{ q.categoryTitle }}
                    </span>

                    <!-- Chevron -->
                    <i
                      class="ti ti-chevron-down q-chevron"
                      [class.q-chevron--open]="expandedIndex() === i"
                    ></i>
                  </div>

                  <!-- Expanded body -->
                  @if (expandedIndex() === i) {
                    <div class="q-body">
                      <div class="think-box">
                        <p class="think-label">💭 Think space</p>
                        <p class="think-text">
                          Take a moment to formulate your answer before looking it up. Consider edge
                          cases, real-world examples, and how you'd explain this in an interview
                          setting.
                        </p>
                      </div>
                      <button
                        class="btn-understood"
                        [class.btn-understood--done]="session()!.completed[i]"
                        [class.btn-understood--pending]="!session()!.completed[i]"
                        (click)="markUnderstood(i)"
                        [id]="'btn-understood-' + i"
                      >
                        <i
                          class="ti"
                          [class.ti-circle-check]="session()!.completed[i]"
                          [class.ti-brain]="!session()!.completed[i]"
                        ></i>
                        {{
                          session()!.completed[i] ? 'Mark as Pending' : 'Got it! Mark Understood'
                        }}
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Completion banner -->
            @if (isComplete()) {
              <div class="completion-banner">
                <div class="completion-emoji">🎉</div>
                <p class="completion-title">Session Complete!</p>
                <p class="completion-sub">
                  You've reviewed all 10 questions for today. Come back tomorrow for a fresh set.
                  @if (streak() > 0) {
                    <br />🔥 Keep your {{ streak() }}-day streak going!
                  }
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './daily-learning.css',
})
export class DailyLearning implements OnInit {
  private dailyService = inject(DailyLearningService);
  private questionService = inject(Question);

  // ── Signals ──────────────────────────────────────────────────────────────
  view = signal<ViewState>('setup');
  selectedMode = signal<LearningMode>('random');
  selectedTopics = signal<string[]>([]);
  expandedIndex = signal<number | null>(null);
  appMode = signal<AppMode>('angular');

  session = this.dailyService.session;
  streak = this.dailyService.streak;
  completedCount = this.dailyService.completedCount;
  progress = this.dailyService.progress;
  isComplete = this.dailyService.isComplete;

  allCategories = signal<CategoryModel[]>([]);

  modeCategories = computed(() => {
    const m = this.appMode();
    return this.allCategories().filter((c) =>
      m === 'nodejs' ? c.id.startsWith('nodejs-') : !c.id.startsWith('nodejs-'),
    );
  });

  canGenerate = computed(() => {
    const mode = this.selectedMode();
    if (mode === 'random') return true;
    if (mode === 'single') return this.selectedTopics().length === 1;
    if (mode === 'mixed') {
      const n = this.selectedTopics().length;
      return n >= 2 && n <= 4;
    }
    return false;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    this.allCategories.set(this.questionService.getCategories());

    const savedMode = localStorage.getItem('prep_mode') as AppMode | null;
    if (savedMode === 'angular' || savedMode === 'nodejs') {
      this.appMode.set(savedMode);
    }

    // Try to restore today's session
    const existing = this.dailyService.loadTodaySession();
    if (existing) {
      this.selectedMode.set(existing.mode);
      this.selectedTopics.set(existing.topicIds);
      this.view.set('session');
    }
  }

  // ── Mode / topic selection ────────────────────────────────────────────────
  setAppMode(m: AppMode) {
    this.appMode.set(m);
    this.selectedTopics.set([]);
  }

  selectMode(m: LearningMode) {
    this.selectedMode.set(m);
    this.selectedTopics.set([]);
    this.expandedIndex.set(null);
  }

  isTopicSelected(id: string): boolean {
    return this.selectedTopics().includes(id);
  }

  toggleTopic(id: string) {
    const current = this.selectedTopics();
    if (current.includes(id)) {
      this.selectedTopics.set(current.filter((t) => t !== id));
    } else {
      const mode = this.selectedMode();
      if (mode === 'single') {
        this.selectedTopics.set([id]);
      } else {
        if (current.length < 4) {
          this.selectedTopics.set([...current, id]);
        }
      }
    }
  }

  // ── Generation ────────────────────────────────────────────────────────────
  generate() {
    this.dailyService.generateSession(
      this.selectedMode(),
      this.modeCategories(),
      this.selectedTopics(),
    );
    this.expandedIndex.set(null);
    this.view.set('session');
  }

  restart() {
    this.dailyService.clearSession();
    this.selectedTopics.set([]);
    this.expandedIndex.set(null);
    this.view.set('setup');
  }

  // ── Card interaction ──────────────────────────────────────────────────────
  toggleExpand(index: number) {
    this.expandedIndex.update((cur) => (cur === index ? null : index));
  }

  markUnderstood(index: number) {
    this.dailyService.toggleComplete(index);
  }

  // ── Display helpers ───────────────────────────────────────────────────────
  formattedDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  modeLabel(): string {
    const labels: Record<LearningMode, string> = {
      single: 'Single Topic',
      mixed: 'Mixed Topics',
      random: 'Random / All Topics',
    };
    return labels[this.selectedMode()];
  }

  modeIcon(): string {
    const icons: Record<LearningMode, string> = {
      single: 'ti-target-arrow',
      mixed: 'ti-layers-intersect',
      random: 'ti-dice-5',
    };
    return icons[this.selectedMode()];
  }
}
