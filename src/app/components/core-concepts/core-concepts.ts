import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoreConceptsService } from '@services/core-concepts.service';
import { CoreConcept } from '@services/core-concepts-data';
import { CalloutVariant } from '@services/system-design-data';

type ViewMode = 'list' | 'detail';

const CALLOUT_ICONS: Record<CalloutVariant, string> = {
  info: 'ti-info-circle',
  tip: 'ti-bulb',
  warning: 'ti-alert-triangle',
  important: 'ti-flame',
};

@Component({
  selector: 'app-core-concepts',
  imports: [RouterLink],
  template: `
    <div class="cc-shell">
      <div class="cc-glow"></div>

      <div class="cc-wrapper">
        <!-- ── Top bar ────────────────────────────────────────────────── -->
        <div class="cc-topbar">
          <a routerLink="/" class="btn-back"> <i class="ti ti-arrow-left"></i> Back to PrepHub </a>

          @if (ccService.overallRead().total > 0) {
            <div class="overall-badge">
              <i class="ti ti-checklist" style="font-size:13px"></i>
              {{ ccService.overallRead().read }} / {{ ccService.overallRead().total }} sections read
              &nbsp;·&nbsp; {{ ccService.overallRead().percent }}%
            </div>
          }
        </div>

        <!-- ════════════════ LIST VIEW ════════════════ -->
        @if (view() === 'list') {
          <div class="animate-in">
            <!-- Page header -->
            <div class="cc-page-header">
              <div class="cc-page-icon"><i class="ti ti-bulb"></i></div>
              <h1 class="cc-page-title">Core Concepts</h1>
              <p class="cc-page-sub">
                The behind-the-scenes mental model every software engineer needs. Zero → Hero guides
                explaining how the Internet, DNS, browsers, protocols, web servers, APIs, backends,
                databases, and file systems actually work.
              </p>
            </div>

            <!-- Mental Model Path -->
            <div class="mental-model-path-card">
              <div class="mental-model-title">
                <i class="ti ti-route" style="color:#f59e0b"></i>
                <span>Complete Mental Model Flow</span>
              </div>
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
            </div>

            <!-- Concepts grid -->
            <div class="concepts-grid">
              @for (concept of ccService.concepts; track concept.id; let i = $index) {
                <button
                  class="concept-card"
                  [style.--card-glow]="concept.accentGlow"
                  (click)="openConcept(concept)"
                  [id]="'concept-card-' + concept.id"
                >
                  <div class="concept-card-top">
                    <div
                      class="concept-icon-lg"
                      [style.background]="concept.color + '20'"
                      [style.color]="concept.color"
                    >
                      <span class="concept-emoji">{{ concept.emoji }}</span>
                    </div>
                    <span class="concept-number">Concept {{ i + 1 }}</span>
                  </div>

                  <div>
                    <p class="concept-title">{{ concept.title }}</p>
                    <p class="concept-tagline">{{ concept.tagline }}</p>
                  </div>

                  <div class="concept-tags">
                    @for (tag of concept.tags.slice(0, 4); track tag) {
                      <span class="concept-tag">{{ tag }}</span>
                    }
                  </div>

                  <div class="concept-footer">
                    <span
                      class="concept-difficulty"
                      [class.diff-beginner]="concept.difficulty === 'Beginner'"
                      [class.diff-foundational]="concept.difficulty === 'Foundational'"
                      [class.diff-intermediate]="concept.difficulty === 'Intermediate'"
                      >{{ concept.difficulty }}</span
                    >

                    <span class="concept-time">
                      <i class="ti ti-clock" style="font-size:11px"></i>
                      {{ concept.estimatedTime }}
                    </span>

                    <!-- Progress ring -->
                    <div class="concept-progress-ring">
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
                          [attr.stroke]="concept.color"
                          stroke-width="3"
                          stroke-linecap="round"
                          [attr.stroke-dasharray]="'87.96'"
                          [attr.stroke-dashoffset]="progressOffset(concept.id)"
                          style="transition: stroke-dashoffset 0.5s ease;"
                        />
                      </svg>
                      <span class="concept-progress-label">
                        {{ conceptProgressPct(concept.id) }}%
                      </span>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>
        }

        <!-- ════════════════ DETAIL VIEW ════════════════ -->
        @if (view() === 'detail' && activeConcept()) {
          <div class="animate-in">
            <!-- Detail header -->
            <div class="detail-header">
              <div class="detail-breadcrumb">
                <button (click)="backToList()" class="btn-breadcrumb-back">
                  <i class="ti ti-chevron-left" style="font-size:10px"></i> All Concepts
                </button>
                <i class="ti ti-slash" style="font-size:9px"></i>
                <span [style.color]="activeConcept()!.color">
                  {{ activeConcept()!.emoji }} {{ activeConcept()!.title }}
                </span>
              </div>

              <div class="detail-title-row">
                <h2 class="detail-concept-title">{{ activeConcept()!.title }}</h2>
              </div>

              <div class="detail-meta">
                <span
                  class="concept-difficulty"
                  [class.diff-beginner]="activeConcept()!.difficulty === 'Beginner'"
                  [class.diff-foundational]="activeConcept()!.difficulty === 'Foundational'"
                  [class.diff-intermediate]="activeConcept()!.difficulty === 'Intermediate'"
                  >{{ activeConcept()!.difficulty }}</span
                >

                <span class="concept-time">
                  <i class="ti ti-clock" style="font-size:11px"></i>
                  {{ activeConcept()!.estimatedTime }}
                </span>

                <span class="sections-count-label">
                  {{ conceptProgress().read }}/{{ conceptProgress().total }} sections read
                </span>
              </div>
            </div>

            <!-- Two-column layout -->
            <div class="detail-layout">
              <!-- LEFT: section navigator -->
              <aside class="detail-sidebar">
                <div class="detail-sidebar-panel">
                  <div class="sidebar-concept-header">
                    <div
                      class="sidebar-concept-icon"
                      [style.background]="activeConcept()!.color + '20'"
                      [style.color]="activeConcept()!.color"
                    >
                      <span>{{ activeConcept()!.emoji }}</span>
                    </div>
                    <span class="sidebar-concept-title">Sections</span>
                  </div>

                  <div class="sidebar-progress-bar">
                    <div
                      class="sidebar-progress-fill"
                      [style.width]="conceptProgress().percent + '%'"
                    ></div>
                  </div>

                  <nav class="section-nav-list">
                    @for (sec of activeConcept()!.sections; track sec.id; let i = $index) {
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
                        <span class="section-nav-text"> {{ i + 1 }}. {{ sec.title }} </span>
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
                          {{ activeSectionIdx() + 1 }} / {{ activeConcept()!.sections.length }}
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

                          @if (block.type === 'diagram' && block.diagram; as d) {
                            <div class="block-diagram">
                              <div class="diagram-banner">
                                <div class="diagram-banner-left">
                                  <div class="diagram-icon-glow">
                                    <i class="ti ti-topology-star"></i>
                                  </div>
                                  <div>
                                    <div class="diagram-tag">
                                      Visual Architecture & Flow Diagram
                                    </div>
                                    <h4 class="diagram-title">{{ d.title }}</h4>
                                    <p class="diagram-subtitle">{{ d.subtitle }}</p>
                                  </div>
                                </div>
                                @if (d.rawSpec) {
                                  <button
                                    type="button"
                                    class="btn-spec-toggle"
                                    (click)="toggleRawSpec(d.id)"
                                    [id]="'btn-spec-' + d.id"
                                  >
                                    <i
                                      class="ti"
                                      [class.ti-terminal-2]="!isRawSpecExpanded(d.id)"
                                      [class.ti-layout-grid]="isRawSpecExpanded(d.id)"
                                    ></i>
                                    {{
                                      isRawSpecExpanded(d.id)
                                        ? 'Hide ASCII Spec'
                                        : 'View ASCII Spec'
                                    }}
                                  </button>
                                }
                              </div>

                              <!-- Visual Node Sequence Flow -->
                              <div class="diagram-flow">
                                @for (node of d.nodes; track node.id; let idx = $index) {
                                  <div class="flow-node-card" [attr.data-type]="node.type">
                                    <div class="flow-node-header">
                                      <div class="flow-node-icon" [attr.data-type]="node.type">
                                        <i [class]="'ti ' + node.icon"></i>
                                      </div>
                                      <div class="flow-node-title-group">
                                        <div class="flow-node-badges">
                                          <span
                                            class="flow-node-type"
                                            [attr.data-type]="node.type"
                                            >{{ node.badge || node.type }}</span
                                          >
                                          @if (node.protocol) {
                                            <span class="flow-node-protocol">{{
                                              node.protocol
                                            }}</span>
                                          }
                                        </div>
                                        <h5 class="flow-node-name">{{ node.name }}</h5>
                                      </div>
                                      <span class="flow-step-badge">Step {{ idx + 1 }}</span>
                                    </div>

                                    <p class="flow-node-subtitle">{{ node.subtitle }}</p>

                                    @if (node.details && node.details.length > 0) {
                                      <ul class="flow-node-bullets">
                                        @for (detail of node.details; track detail) {
                                          <li>{{ detail }}</li>
                                        }
                                      </ul>
                                    }
                                  </div>

                                  @if (idx < d.nodes.length - 1) {
                                    <div class="flow-connector">
                                      <div class="flow-connector-line"></div>
                                      <div class="flow-connector-pill">
                                        <i
                                          class="ti ti-arrow-down-circle-filled connector-arrow"
                                        ></i>
                                        @if (d.connections && d.connections[idx]) {
                                          <span class="flow-connector-label">{{
                                            d.connections[idx].label
                                          }}</span>
                                          @if (d.connections[idx].protocol) {
                                            <span class="flow-connector-proto">{{
                                              d.connections[idx].protocol
                                            }}</span>
                                          }
                                        }
                                      </div>
                                      <div class="flow-connector-line"></div>
                                    </div>
                                  }
                                }
                              </div>

                              <!-- Key Takeaways -->
                              @if (d.keyTakeaways && d.keyTakeaways.length > 0) {
                                <div class="diagram-takeaways">
                                  <div class="takeaways-header">
                                    <i class="ti ti-sparkles" style="color: #fbbf24;"></i>
                                    <span>Architecture & Engineering Insights</span>
                                  </div>
                                  <ul class="takeaways-bullets">
                                    @for (tip of d.keyTakeaways; track tip) {
                                      <li>{{ tip }}</li>
                                    }
                                  </ul>
                                </div>
                              }

                              <!-- Raw Spec View -->
                              @if (d.rawSpec && isRawSpecExpanded(d.id)) {
                                <div class="diagram-raw-spec animate-in">
                                  <div class="spec-header">
                                    <i class="ti ti-terminal-2"></i>
                                    <span>Technical Architecture Specification & ASCII Flow</span>
                                  </div>
                                  <pre class="spec-pre"><code>{{ d.rawSpec }}</code></pre>
                                </div>
                              }
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
                        {{ activeSectionIdx() + 1 }} / {{ activeConcept()!.sections.length }}
                      </span>

                      <button
                        class="btn-section-nav"
                        [disabled]="activeSectionIdx() === activeConcept()!.sections.length - 1"
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
  styleUrl: './core-concepts.css',
})
export class CoreConcepts {
  protected ccService = inject(CoreConceptsService);

  // ── Signals ──────────────────────────────────────────────────────────────
  view = signal<ViewMode>('list');
  activeConcept = signal<CoreConcept | null>(null);
  activeSectionIdx = signal<number>(0);

  activeSection = computed(() => {
    const c = this.activeConcept();
    const idx = this.activeSectionIdx();
    return c?.sections[idx] ?? null;
  });

  conceptProgress = computed(() => {
    const c = this.activeConcept();
    return c ? this.ccService.conceptProgress(c.id) : { total: 0, read: 0, percent: 0 };
  });

  // ── Mental Model Learning Path ────────────────────────────────────────────
  learningPath = [
    { label: 'Internet' },
    { label: 'DNS' },
    { label: 'Browser' },
    { label: 'HTTP' },
    { label: 'HTTPS' },
    { label: 'Load Balancer' },
    { label: 'Web Server' },
    { label: 'APIs' },
    { label: 'Backend' },
    { label: 'Database' },
    { label: 'Storage' },
  ];

  calloutIconMap = CALLOUT_ICONS;

  // ── Navigation ────────────────────────────────────────────────────────────
  openConcept(concept: CoreConcept) {
    this.activeConcept.set(concept);
    this.activeSectionIdx.set(0);
    this.view.set('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToList() {
    this.view.set('list');
    this.activeConcept.set(null);
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
    const concept = this.activeConcept();
    const idx = this.activeSectionIdx();
    if (concept && idx < concept.sections.length - 1) {
      // Auto-mark current section as read on Next
      const sec = this.activeSection();
      if (sec && !this.isSectionRead(sec.id)) {
        this.ccService.toggleSection(concept.id, sec.id);
      }
      this.activeSectionIdx.set(idx + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  isSectionRead(sectionId: string): boolean {
    const concept = this.activeConcept();
    return concept ? this.ccService.isSectionRead(concept.id, sectionId) : false;
  }

  toggleRead(sectionId: string) {
    const concept = this.activeConcept();
    if (concept) this.ccService.toggleSection(concept.id, sectionId);
  }

  markAllRead() {
    const concept = this.activeConcept();
    if (concept) this.ccService.markAllRead(concept.id);
  }

  // ── Grid helpers ──────────────────────────────────────────────────────────
  conceptProgressPct(conceptId: string): number {
    return this.ccService.conceptProgress(conceptId).percent;
  }

  /** SVG circle circumference = 2π × 14 ≈ 87.96; offset controls filled arc */
  progressOffset(conceptId: string): number {
    const pct = this.ccService.conceptProgress(conceptId).percent;
    return 87.96 * (1 - pct / 100);
  }

  isMilestoneComplete(index: number): boolean {
    const concept = this.ccService.concepts[index];
    return concept ? this.ccService.conceptProgress(concept.id).percent === 100 : false;
  }

  calloutIcon(variant: CalloutVariant | undefined): string {
    return variant ? CALLOUT_ICONS[variant] : 'ti-info-circle';
  }

  // ── Technical Spec Toggle ────────────────────────────────────────────────
  rawSpecExpanded = signal<Record<string, boolean>>({});

  toggleRawSpec(diagramId: string) {
    const current = this.rawSpecExpanded();
    this.rawSpecExpanded.set({
      ...current,
      [diagramId]: !current[diagramId],
    });
  }

  isRawSpecExpanded(diagramId: string): boolean {
    return !!this.rawSpecExpanded()[diagramId];
  }
}
