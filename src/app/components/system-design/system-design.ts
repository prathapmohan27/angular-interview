import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SystemDesignService } from '@services/system-design.service';
import { SystemDesignSystem, CalloutVariant } from '@services/system-design-data';

type ViewMode = 'list' | 'detail';

const CALLOUT_ICONS: Record<CalloutVariant, string> = {
  info: 'ti-info-circle',
  tip: 'ti-bulb',
  warning: 'ti-alert-triangle',
  important: 'ti-flame',
};

@Component({
  selector: 'app-system-design',
  imports: [RouterLink],
  template: `
    <div class="sd-shell">
      <div class="sd-glow"></div>

      <div class="sd-wrapper">
        <!-- ── Top bar ────────────────────────────────────────────────── -->
        <div class="sd-topbar">
          <a routerLink="/" class="btn-back"> <i class="ti ti-arrow-left"></i> Back to PrepHub </a>

          @if (sdService.overallRead().total > 0) {
            <div class="overall-badge">
              <i class="ti ti-checklist" style="font-size:13px"></i>
              {{ sdService.overallRead().read }} / {{ sdService.overallRead().total }} sections read
              &nbsp;·&nbsp; {{ sdService.overallRead().percent }}%
            </div>
          }
        </div>

        <!-- ════════════════ LIST VIEW ════════════════ -->
        @if (view() === 'list') {
          <div class="animate-in">
            <!-- Page header -->
            <div class="sd-page-header">
              <div class="sd-page-icon"><i class="ti ti-school"></i></div>
              <h1 class="sd-page-title">System Design</h1>
              <p class="sd-page-sub">
                11 carefully chosen systems — from your first single-server URL shortener and
                distributed load balancer to a production-grade payment processor. Each system
                builds on the last, taking you from zero to confident in real system design
                interviews.
              </p>
            </div>

            <!-- Learning path -->
            <div class="learning-path">
              @for (step of learningPath; track step.label; let i = $index) {
                <span class="path-step" [class.path-step--done]="isMilestoneComplete(i)">{{
                  step.label
                }}</span>
                @if (i < learningPath.length - 1) {
                  <i class="ti ti-chevron-right path-arrow"></i>
                }
              }
            </div>

            <!-- Systems grid -->
            <div class="systems-grid">
              @for (sys of sdService.systems; track sys.id; let i = $index) {
                <button
                  class="sys-card"
                  [style.--card-glow]="sys.accentGlow"
                  (click)="openSystem(sys)"
                  [id]="'sys-card-' + sys.id"
                >
                  <div class="sys-card-top">
                    <div
                      class="sys-icon-lg"
                      [style.background]="sys.color + '20'"
                      [style.color]="sys.color"
                    >
                      <i [class]="'ti ' + sys.icon"></i>
                    </div>
                    <span class="sys-number">System {{ i + 1 }}</span>
                  </div>

                  <div>
                    <p class="sys-title">{{ sys.title }}</p>
                    <p class="sys-tagline">{{ sys.tagline }}</p>
                  </div>

                  <div class="sys-tags">
                    @for (tag of sys.tags.slice(0, 4); track tag) {
                      <span class="sys-tag">{{ tag }}</span>
                    }
                  </div>

                  <div class="sys-footer">
                    <span
                      class="sys-difficulty"
                      [class.diff-beginner]="sys.difficulty === 'Beginner'"
                      [class.diff-intermediate]="sys.difficulty === 'Intermediate'"
                      [class.diff-advanced]="sys.difficulty === 'Advanced'"
                      >{{ sys.difficulty }}</span
                    >

                    <span class="sys-time">
                      <i class="ti ti-clock" style="font-size:11px"></i>
                      {{ sys.estimatedTime }}
                    </span>

                    <!-- Progress ring -->
                    <div class="sys-progress-ring">
                      <svg width="36" height="36" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="rgba(63,63,70,0.4)"
                          stroke-width="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          [attr.stroke]="sys.color"
                          stroke-width="3"
                          stroke-linecap="round"
                          [attr.stroke-dasharray]="'87.96'"
                          [attr.stroke-dashoffset]="progressOffset(sys.id)"
                          style="transition: stroke-dashoffset 0.5s ease;"
                        />
                      </svg>
                      <span class="sys-progress-label"> {{ systemProgressPct(sys.id) }}% </span>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>
        }

        <!-- ════════════════ DETAIL VIEW ════════════════ -->
        @if (view() === 'detail' && activeSystem()) {
          <div class="animate-in">
            <!-- Detail header -->
            <div class="detail-header">
              <div class="detail-breadcrumb">
                <button
                  (click)="backToList()"
                  style="background:none;border:none;cursor:pointer;color:inherit;font:inherit;display:flex;align-items:center;gap:5px;padding:0;"
                >
                  <i class="ti ti-chevron-left" style="font-size:10px"></i> All Systems
                </button>
                <i class="ti ti-slash" style="font-size:9px"></i>
                <span [style.color]="activeSystem()!.color">{{ activeSystem()!.title }}</span>
              </div>

              <h2 class="detail-sys-title">{{ activeSystem()!.title }}</h2>

              <div class="detail-meta">
                <span
                  class="sys-difficulty"
                  [class.diff-beginner]="activeSystem()!.difficulty === 'Beginner'"
                  [class.diff-intermediate]="activeSystem()!.difficulty === 'Intermediate'"
                  [class.diff-advanced]="activeSystem()!.difficulty === 'Advanced'"
                  >{{ activeSystem()!.difficulty }}</span
                >

                <span class="sys-time">
                  <i class="ti ti-clock" style="font-size:11px"></i>
                  {{ activeSystem()!.estimatedTime }}
                </span>

                <span style="font:600 0.7rem var(--font-mono); color:var(--color-text-faint);">
                  {{ systemProgress().read }}/{{ systemProgress().total }} sections read
                </span>
              </div>
            </div>

            <!-- Two-column layout -->
            <div class="detail-layout">
              <!-- LEFT: section navigator -->
              <aside class="detail-sidebar">
                <div class="detail-sidebar-panel">
                  <div class="sidebar-sys-header">
                    <div
                      class="sidebar-sys-icon"
                      [style.background]="activeSystem()!.color + '20'"
                      [style.color]="activeSystem()!.color"
                    >
                      <i [class]="'ti ' + activeSystem()!.icon"></i>
                    </div>
                    <span class="sidebar-sys-title">Sections</span>
                  </div>

                  <div class="sidebar-progress-bar">
                    <div
                      class="sidebar-progress-fill"
                      [style.width]="systemProgress().percent + '%'"
                    ></div>
                  </div>

                  <nav class="section-nav-list">
                    @for (sec of activeSystem()!.sections; track sec.id; let i = $index) {
                      <button
                        class="section-nav-btn"
                        [class.section-nav-btn--active]="activeSectionIdx() === i"
                        [class.section-nav-btn--read]="
                          isSectionRead(sec.id) && activeSectionIdx() !== i
                        "
                        (click)="goToSection(i)"
                        [id]="'sec-nav-' + sec.id"
                      >
                        <i [class]="'ti ' + sec.icon + ' section-nav-icon'"></i>
                        <span
                          style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                        >
                          {{ i + 1 }}. {{ sec.title }}
                        </span>
                        @if (isSectionRead(sec.id)) {
                          <i class="ti ti-check section-nav-check"></i>
                        }
                      </button>
                    }
                  </nav>
                </div>

                <!-- Mark all read -->
                <button
                  class="btn-back"
                  style="width:100%;justify-content:center;"
                  (click)="markAllRead()"
                  id="btn-mark-all-read"
                >
                  <i class="ti ti-checks"></i> Mark All Read
                </button>
              </aside>

              <!-- RIGHT: section content -->
              <main class="detail-main">
                @if (activeSection(); as sec) {
                  <div class="section-view animate-in" [attr.key]="sec.id">
                    <!-- Section top bar -->
                    <div class="section-top-bar">
                      <div class="section-title-group">
                        <div class="section-icon-sm">
                          <i [class]="'ti ' + sec.icon"></i>
                        </div>
                        <span class="section-title">{{ sec.title }}</span>
                        <span class="section-counter">
                          {{ activeSectionIdx() + 1 }} / {{ activeSystem()!.sections.length }}
                        </span>
                      </div>

                      <div class="section-actions">
                        <button
                          class="btn-read-toggle"
                          [class.btn-read-toggle--read]="isSectionRead(sec.id)"
                          [class.btn-read-toggle--unread]="!isSectionRead(sec.id)"
                          (click)="toggleRead(sec.id)"
                          [id]="'btn-toggle-' + sec.id"
                        >
                          <i
                            class="ti"
                            [class.ti-circle-check]="isSectionRead(sec.id)"
                            [class.ti-book]="!isSectionRead(sec.id)"
                          ></i>
                          {{ isSectionRead(sec.id) ? 'Marked as Read' : 'Mark as Read' }}
                        </button>
                      </div>
                    </div>

                    <!-- Content blocks -->
                    <div class="section-body">
                      @for (block of sec.blocks; track $index) {
                        <div class="content-block">
                          @if (block.type === 'heading2') {
                            <h3 class="block-h2">{{ block.text }}</h3>
                          }

                          @if (block.type === 'heading3') {
                            <h4 class="block-h3">{{ block.text }}</h4>
                          }

                          @if (block.type === 'paragraph') {
                            <p class="block-p">{{ block.text }}</p>
                          }

                          @if (block.type === 'bullets' && block.items) {
                            <ul class="block-bullets">
                              @for (item of block.items; track item) {
                                <li>{{ item }}</li>
                              }
                            </ul>
                          }

                          @if (block.type === 'numbered' && block.items) {
                            <ol class="block-numbered">
                              @for (item of block.items; track item) {
                                <li>{{ item }}</li>
                              }
                            </ol>
                          }

                          @if (block.type === 'code' && block.code) {
                            <div class="block-code">
                              <code>{{ block.code }}</code>
                            </div>
                          }

                          @if (block.type === 'divider') {
                            <div class="block-divider"></div>
                          }

                          @if (block.type === 'callout') {
                            <div
                              class="block-callout"
                              [class.callout-info]="block.variant === 'info'"
                              [class.callout-tip]="block.variant === 'tip'"
                              [class.callout-warning]="block.variant === 'warning'"
                              [class.callout-important]="block.variant === 'important'"
                            >
                              <i
                                class="ti section-nav-icon callout-icon"
                                [class]="'ti ' + calloutIcon(block.variant)"
                              ></i>
                              <span class="callout-text">{{ block.text }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>

                    <!-- Prev / Next navigation -->
                    <div class="section-nav-row">
                      <button
                        class="btn-section-nav"
                        [disabled]="activeSectionIdx() === 0"
                        (click)="prevSection()"
                        id="btn-prev-section"
                      >
                        <i class="ti ti-chevron-left"></i> Previous
                      </button>

                      <span class="section-nav-center">
                        {{ activeSectionIdx() + 1 }} / {{ activeSystem()!.sections.length }}
                      </span>

                      <button
                        class="btn-section-nav"
                        [disabled]="activeSectionIdx() === activeSystem()!.sections.length - 1"
                        (click)="nextSection()"
                        id="btn-next-section"
                      >
                        Next <i class="ti ti-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                }
              </main>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './system-design.css',
})
export class SystemDesign {
  protected sdService = inject(SystemDesignService);

  // ── Signals ──────────────────────────────────────────────────────────────
  view = signal<ViewMode>('list');
  activeSystem = signal<SystemDesignSystem | null>(null);
  activeSectionIdx = signal<number>(0);

  activeSection = computed(() => {
    const sys = this.activeSystem();
    const idx = this.activeSectionIdx();
    return sys?.sections[idx] ?? null;
  });

  systemProgress = computed(() => {
    const sys = this.activeSystem();
    return sys ? this.sdService.systemProgress(sys.id) : { total: 0, read: 0, percent: 0 };
  });

  // ── Static data ───────────────────────────────────────────────────────────
  learningPath = [
    { label: 'Fundamentals' },
    { label: 'Rate Limiting' },
    { label: 'Load Balancing' },
    { label: 'Caching' },
    { label: 'Real-time' },
    { label: 'Async' },
    { label: 'Storage' },
    { label: 'Social Scale' },
    { label: 'Streaming' },
    { label: 'Distributed' },
    { label: 'Production-Grade' },
  ];

  calloutIconMap = CALLOUT_ICONS;

  // ── Navigation ────────────────────────────────────────────────────────────
  openSystem(sys: SystemDesignSystem) {
    this.activeSystem.set(sys);
    this.activeSectionIdx.set(0);
    this.view.set('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToList() {
    this.view.set('list');
    this.activeSystem.set(null);
    this.activeSectionIdx.set(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToSection(idx: number) {
    this.activeSectionIdx.set(idx);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevSection() {
    const idx = this.activeSectionIdx();
    if (idx > 0) this.activeSectionIdx.set(idx - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextSection() {
    const sys = this.activeSystem();
    const idx = this.activeSectionIdx();
    if (sys && idx < sys.sections.length - 1) {
      // Auto-mark current section as read on Next
      const sec = this.activeSection();
      if (sec && !this.isSectionRead(sec.id)) {
        this.sdService.toggleSection(sys.id, sec.id);
      }
      this.activeSectionIdx.set(idx + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  isSectionRead(sectionId: string): boolean {
    const sys = this.activeSystem();
    return sys ? this.sdService.isSectionRead(sys.id, sectionId) : false;
  }

  toggleRead(sectionId: string) {
    const sys = this.activeSystem();
    if (sys) this.sdService.toggleSection(sys.id, sectionId);
  }

  markAllRead() {
    const sys = this.activeSystem();
    if (sys) this.sdService.markAllRead(sys.id);
  }

  // ── Grid helpers ──────────────────────────────────────────────────────────
  systemProgressPct(systemId: string): number {
    return this.sdService.systemProgress(systemId).percent;
  }

  /** SVG circle circumference = 2π × 14 ≈ 87.96; offset controls filled arc */
  progressOffset(systemId: string): number {
    const pct = this.sdService.systemProgress(systemId).percent;
    return 87.96 * (1 - pct / 100);
  }

  isMilestoneComplete(index: number): boolean {
    const sys = this.sdService.systems[index];
    return sys ? this.sdService.systemProgress(sys.id).percent === 100 : false;
  }

  calloutIcon(variant: CalloutVariant | undefined): string {
    return variant ? CALLOUT_ICONS[variant] : 'ti-info-circle';
  }
}
