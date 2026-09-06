import { Routes } from '@angular/router';
import { Questions } from '@components/questions';

export const routes: Routes = [
  { path: '', component: Questions },
  {
    path: 'daily',
    loadComponent: () =>
      import('./components/daily-learning/daily-learning').then((m) => m.DailyLearning),
  },
  {
    path: 'system-design',
    loadComponent: () =>
      import('./components/system-design/system-design').then((m) => m.SystemDesign),
  },
  {
    path: 'core-concepts',
    loadComponent: () =>
      import('./components/core-concepts/core-concepts').then((m) => m.CoreConcepts),
  },
  { path: '**', redirectTo: '' },
];
