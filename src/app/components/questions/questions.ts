import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '@components/header';
import { Stats } from '@components/stats';
import { Category } from '@components/category';
import { Question, CategoryModel } from '@services/question';

type AppMode = 'angular' | 'nodejs';

@Component({
  selector: 'app-questions',
  imports: [Header, Stats, Category, RouterLink],
  template: `
    <div class="page-shell">
      <div class="radial-glow radial-glow-overlay"></div>

      <div class="page-wrapper">
        <!-- Top header strip -->
        <div class="header-strip">
          <!-- Logo + title -->
          <div class="flex-row-center logo-gap">
            <div
              class="logo-box"
              [class.logo-box--angular]="mode() === 'angular'"
              [class.logo-box--node]="mode() === 'nodejs'"
            >
              <i [class]="mode() === 'angular' ? 'ti ti-brand-angular' : 'ti ti-brand-nodejs'"></i>
            </div>
            <div>
              <h1 class="title-main">PrepHub</h1>
              <span class="subtitle-main">
                {{
                  mode() === 'angular'
                    ? 'Angular Interview Companion'
                    : 'Node.js Interview Companion'
                }}
              </span>
            </div>
          </div>

          <!-- Mode Switcher Pill -->
          <div class="mode-pill">
            <button
              (click)="switchMode('angular')"
              class="btn-mode-tab"
              [class.btn-mode-tab--active-angular]="mode() === 'angular'"
              [class.btn-mode-tab--inactive]="mode() !== 'angular'"
            >
              <i class="ti ti-brand-angular text-[16px]"></i> Angular
            </button>
            <div class="divider-vt"></div>
            <button
              (click)="switchMode('nodejs')"
              class="btn-mode-tab"
              [class.btn-mode-tab--active-node]="mode() === 'nodejs'"
              [class.btn-mode-tab--inactive]="mode() !== 'nodejs'"
            >
              <i class="ti ti-brand-nodejs text-[16px]"></i> Node.js
            </button>
          </div>

          <!-- Feature CTAs -->
          <div class="header-ctas">
            <a routerLink="/core-concepts" class="btn-core-concepts" id="btn-core-concepts">
              <i class="ti ti-bulb"></i>
              Core Concepts
              <span class="btn-cc-badge">11 topics</span>
            </a>
            <a routerLink="/daily" class="btn-daily-learning" id="btn-daily-learning">
              <i class="ti ti-calendar-stats"></i>
              Daily Learning
              <span class="btn-daily-badge">10 Q/day</span>
            </a>
            <a routerLink="/system-design" class="btn-system-design" id="btn-system-design">
              <i class="ti ti-topology-star"></i>
              System Design
              <span class="btn-sd-badge">11 systems</span>
            </a>
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="grid-sidebar-main">
          <!-- LEFT SIDEBAR -->
          <aside class="sidebar">
            <div class="glass-panel sidebar-panel">
              <p class="section-label sidebar-label">
                {{ mode() === 'angular' ? 'Angular Topics' : 'Node.js Topics' }}
              </p>

              <!-- All Topics -->
              <button
                (click)="selectCategory(null)"
                class="btn-tab"
                [class.btn-tab--active]="selectedCategory() === null"
              >
                <span class="flex-row-center gap-2">
                  <span class="icon-box icon-box-default">
                    <i class="ti ti-apps"></i>
                  </span>
                  All Topics
                </span>
                <span class="cat-badge">{{ totalDatabaseQuestions() }}</span>
              </button>

              <div class="divider-hz"></div>

              <!-- Category list -->
              <div class="sidebar-list">
                @for (cat of modeCategories(); track cat.id) {
                  <button
                    (click)="selectCategory(cat)"
                    class="btn-tab"
                    [class.btn-tab--active]="selectedCategory()?.id === cat.id"
                  >
                    <span class="flex-row-center overflow-hidden-nowrap gap-2 flex-1 min-w-0">
                      <span
                        class="icon-box"
                        [style.color]="cat.color"
                        [style.background]="cat.color + '18'"
                      >
                        <i [class]="'ti ' + cat.icon"></i>
                      </span>
                      <span class="text-ellipsis">{{ cat.title }}</span>
                    </span>
                    <span class="cat-badge shrink-0">{{ cat.questions.length }}</span>
                  </button>
                }
              </div>
            </div>
          </aside>

          <!-- RIGHT MAIN PANEL -->
          <main class="main-content">
            <app-header
              [isExpanded]="allOpen()"
              [activeFilter]="activeFilter()"
              (searchChange)="onSearch($event)"
              (expandAll)="toggleExpandAll()"
              (filterChange)="onFilterChange($event)"
              (randomChallenge)="triggerSpotlight()"
            />

            <app-stats
              [totalQuestions]="totalDatabaseQuestions()"
              [preparedQuestions]="preparedSet().size"
              [starredQuestions]="starredSet().size"
              [totalCategories]="modeCategories().length"
            />

            <!-- Spotlight card -->
            @if (spotlightQuestion()) {
              <div class="glass-panel animate-fade-in spotlight-card">
                <div class="flex-between">
                  <span class="spotlight-label">
                    <i class="ti ti-dice-5 text-[14px]"></i>
                    Mock Interview Challenge
                  </span>
                  <button (click)="clearSpotlight()" class="btn-icon-small">
                    <i class="ti ti-x"></i>
                  </button>
                </div>

                <div class="spotlight-q-box">
                  <p class="spotlight-q-text">"{{ spotlightQuestion() }}"</p>
                  <span
                    class="spotlight-cat-tag"
                    [style.color]="spotlightCategory()?.color"
                    [style.background]="spotlightCategory()?.color + '18'"
                    >{{ spotlightCategory()?.title }}</span
                  >
                </div>

                <div class="flex-wrap-gap">
                  <button (click)="togglePreparedSpotlight()" class="btn-mastered">
                    <i
                      class="ti"
                      [class.ti-circle-check]="isSpotlightPrepared()"
                      [class.ti-circle]="!isSpotlightPrepared()"
                    ></i>
                    {{ isSpotlightPrepared() ? 'Mastered ✓' : 'Mark as Mastered' }}
                  </button>
                  <button (click)="triggerSpotlight()" class="btn-ghost">
                    <i class="ti ti-refresh-dot"></i> Try Another
                  </button>
                  <a
                    [href]="studyDocsUrl(spotlightQuestion() || '')"
                    target="_blank"
                    class="btn-ghost action-link"
                  >
                    <i class="ti ti-external-link"></i>
                    {{ mode() === 'angular' ? 'Angular Docs' : 'Node.js Docs' }}
                  </a>
                </div>
              </div>
            }

            <!-- Category list -->
            <div class="categories-list">
              @if (visibleCategories().length === 0) {
                <div class="glass-panel empty-state-panel">
                  <div class="empty-state-icon">
                    <i class="ti ti-search-off"></i>
                  </div>
                  <p class="empty-headline">No questions match your current filters</p>
                  <p class="empty-sub">Try resetting the search or switching category tabs.</p>
                </div>
              } @else {
                @for (cat of visibleCategories(); track cat.id) {
                  <app-category
                    [category]="cat"
                    [searchFilter]="searchFilter()"
                    [forceOpen]="allOpen()"
                    [preparedSet]="preparedSet()"
                    [starredSet]="starredSet()"
                    [notesMap]="notesMap()"
                    [mode]="mode()"
                    (togglePrepared)="togglePrepared($event)"
                    (toggleStarred)="toggleStarred($event)"
                    (notesChange)="onNotesChange($event)"
                  />
                }
              }
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  styleUrl: './questions.css',
})
export class Questions implements OnInit {
  categories = signal<CategoryModel[]>([]);
  searchFilter = signal<string>('');
  allOpen = signal<boolean>(false);

  preparedSet = signal<Set<string>>(new Set());
  starredSet = signal<Set<string>>(new Set());
  notesMap = signal<Record<string, string>>({});

  activeFilter = signal<string>('all');
  selectedCategory = signal<CategoryModel | null>(null);
  mode = signal<AppMode>('angular');

  spotlightQuestion = signal<string | null>(null);
  spotlightCategory = signal<CategoryModel | null>(null);

  private questionService: Question = inject(Question);

  modeCategories = computed(() => {
    const m = this.mode();
    return this.categories().filter((cat) =>
      m === 'nodejs' ? cat.id.startsWith('nodejs-') : !cat.id.startsWith('nodejs-'),
    );
  });

  totalDatabaseQuestions = computed(() =>
    this.modeCategories().reduce((acc, cat) => acc + cat.questions.length, 0),
  );

  visibleCategories = computed(() => {
    const filter = this.searchFilter().toLowerCase();
    const activeF = this.activeFilter();
    const selectedCat = this.selectedCategory();
    const targetCats = selectedCat ? [selectedCat] : this.modeCategories();

    return targetCats
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter((q) => {
          if (filter && !q.toLowerCase().includes(filter)) return false;
          if (activeF === 'prepared') return this.preparedSet().has(q);
          if (activeF === 'starred') return this.starredSet().has(q);
          if (activeF === 'unprepared') return !this.preparedSet().has(q);
          return true;
        }),
      }))
      .filter((cat) => cat.questions.length > 0);
  });

  isSpotlightPrepared = computed(() => {
    const q = this.spotlightQuestion();
    return q ? this.preparedSet().has(q) : false;
  });

  ngOnInit() {
    this.categories.set(this.questionService.getCategories());
    this.loadState();
    const savedMode = localStorage.getItem('prep_mode') as AppMode | null;
    if (savedMode === 'angular' || savedMode === 'nodejs') {
      this.mode.set(savedMode);
    }
  }

  switchMode(m: AppMode) {
    this.mode.set(m);
    this.selectedCategory.set(null);
    this.searchFilter.set('');
    this.clearSpotlight();
    localStorage.setItem('prep_mode', m);
  }

  onSearch(filter: string) {
    this.searchFilter.set(filter);
  }
  toggleExpandAll() {
    this.allOpen.update((v) => !v);
  }
  onFilterChange(filter: string) {
    this.activeFilter.set(filter);
  }
  selectCategory(cat: CategoryModel | null) {
    this.selectedCategory.set(cat);
  }

  private loadState() {
    try {
      const prepared = JSON.parse(localStorage.getItem('prep_prepared') || '[]');
      const starred = JSON.parse(localStorage.getItem('prep_starred') || '[]');
      const notes = JSON.parse(localStorage.getItem('prep_notes') || '{}');
      this.preparedSet.set(new Set<string>(prepared));
      this.starredSet.set(new Set<string>(starred));
      this.notesMap.set(notes);
    } catch (e) {
      console.error('Failed to load storage state', e);
    }
  }

  togglePrepared(q: string) {
    const updated = new Set(this.preparedSet());
    if (updated.has(q)) {
      updated.delete(q);
    } else {
      updated.add(q);
    }
    this.preparedSet.set(updated);
    localStorage.setItem('prep_prepared', JSON.stringify(Array.from(updated)));
  }

  toggleStarred(q: string) {
    const updated = new Set(this.starredSet());
    if (updated.has(q)) {
      updated.delete(q);
    } else {
      updated.add(q);
    }
    this.starredSet.set(updated);
    localStorage.setItem('prep_starred', JSON.stringify(Array.from(updated)));
  }

  onNotesChange(event: { question: string; notes: string }) {
    const updated = { ...this.notesMap(), [event.question]: event.notes };
    this.notesMap.set(updated);
    localStorage.setItem('prep_notes', JSON.stringify(updated));
  }

  triggerSpotlight() {
    const pool = this.visibleCategories().reduce<{ q: string; cat: CategoryModel }[]>(
      (acc, cat) => {
        const origCat = this.modeCategories().find((c) => c.id === cat.id);
        if (origCat) cat.questions.forEach((q) => acc.push({ q, cat: origCat }));
        return acc;
      },
      [],
    );
    if (!pool.length) {
      this.clearSpotlight();
      return;
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    this.spotlightQuestion.set(item.q);
    this.spotlightCategory.set(item.cat);
  }

  clearSpotlight() {
    this.spotlightQuestion.set(null);
    this.spotlightCategory.set(null);
  }

  togglePreparedSpotlight() {
    const q = this.spotlightQuestion();
    if (q) this.togglePrepared(q);
  }

  studyDocsUrl(question: string): string {
    const q = encodeURIComponent(question);
    return this.mode() === 'nodejs'
      ? `https://www.google.com/search?q=site%3Anodejs.org+${q}`
      : `https://www.google.com/search?q=site%3Aangular.dev+${q}`;
  }

  /** Close icon button for spotlight */
  readonly btn_icon_small_classes = 'btn-icon-small';
}
