import { Injectable, signal, computed } from '@angular/core';

/**
 * Interfaz para una tarea del tablero Kanban.
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  assignee: { name: string; initials: string; color: string };
  progress: number;
  tags: string[];
  dueDate?: string;
  subtasks?: { total: number; completed: number };
}

/**
 * Interfaz para una anotación del módulo de revisión.
 */
export interface Annotation {
  id: string;
  text: string;
  author: { name: string; initials: string; color: string };
  urgency: 'critical' | 'suggestion' | 'resolved';
  posX: number; // % from left
  posY: number; // % from top
  timestamp: Date;
  resolved: boolean;
}

/**
 * @class TaskService
 * @description Servicio central para la gestión de tareas y anotaciones.
 * Proporciona datos mock para las vistas Kanban y Review.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {

  /** Signal reactivo con todas las tareas */
  tasks = signal<Task[]>([
    {
      id: 't1', title: 'Diseñar módulo de pesajes',
      description: 'Crear wireframes para la vista de pesaje con gráficos de evolución',
      status: 'done', priority: 'high',
      assignee: { name: 'Ana López', initials: 'AL', color: '#1b4332' },
      progress: 100, tags: ['UX', 'Diseño'],
      subtasks: { total: 4, completed: 4 }
    },
    {
      id: 't2', title: 'API de Reproducción',
      description: 'Implementar endpoints REST para gestación y partos',
      status: 'in-progress', priority: 'high',
      assignee: { name: 'Carlos Ruiz', initials: 'CR', color: '#582f0e' },
      progress: 65, tags: ['Backend', 'API'],
      subtasks: { total: 6, completed: 4 }
    },
    {
      id: 't3', title: 'Integrar Supabase Auth',
      description: 'Configurar autenticación con roles y permisos por finca',
      status: 'in-progress', priority: 'medium',
      assignee: { name: 'María Torres', initials: 'MT', color: '#40916c' },
      progress: 40, tags: ['Auth', 'Seguridad'],
      subtasks: { total: 5, completed: 2 }
    },
    {
      id: 't4', title: 'Dashboard KPIs financieros',
      description: 'Agregar tarjetas de margen bruto y balance mensual',
      status: 'todo', priority: 'medium',
      assignee: { name: 'Juan García', initials: 'JG', color: '#6366f1' },
      progress: 0, tags: ['Frontend', 'Charts']
    },
    {
      id: 't5', title: 'Exportar PDF con jsPDF',
      description: 'Generar reportes PDF con estilo Rustic-Luxe corporativo',
      status: 'done', priority: 'low',
      assignee: { name: 'Ana López', initials: 'AL', color: '#1b4332' },
      progress: 100, tags: ['PDF', 'Reportes'],
      subtasks: { total: 3, completed: 3 }
    },
    {
      id: 't6', title: 'Módulo de Lotes (CRUD)',
      description: 'Vista de gestión de potreros con mapa y asignación',
      status: 'todo', priority: 'high',
      assignee: { name: 'Carlos Ruiz', initials: 'CR', color: '#582f0e' },
      progress: 0, tags: ['Frontend', 'Mapa']
    },
    {
      id: 't7', title: 'Optimizar carga offline',
      description: 'Implementar service worker con estrategia cache-first',
      status: 'backlog', priority: 'medium',
      assignee: { name: 'María Torres', initials: 'MT', color: '#40916c' },
      progress: 0, tags: ['PWA', 'Performance']
    },
    {
      id: 't8', title: 'Tests E2E con Cypress',
      description: 'Escribir suite de pruebas para flujos críticos',
      status: 'backlog', priority: 'low',
      assignee: { name: 'Juan García', initials: 'JG', color: '#6366f1' },
      progress: 0, tags: ['Testing', 'QA']
    },
    {
      id: 't9', title: 'Bug: Filtro de sanidad',
      description: 'El filtro por fecha no funciona correctamente en móvil',
      status: 'blocked', priority: 'high',
      assignee: { name: 'Carlos Ruiz', initials: 'CR', color: '#582f0e' },
      progress: 30, tags: ['Bug', 'Mobile']
    },
    {
      id: 't10', title: 'Alertas inteligentes v2',
      description: 'Mejorar el algoritmo de detección de alertas tempranas',
      status: 'backlog', priority: 'medium',
      assignee: { name: 'Ana López', initials: 'AL', color: '#1b4332' },
      progress: 0, tags: ['IA', 'Alertas']
    },
    {
      id: 't11', title: 'Modo oscuro completo',
      description: 'Verificar todos los componentes en tema nocturno',
      status: 'in-progress', priority: 'low',
      assignee: { name: 'Juan García', initials: 'JG', color: '#6366f1' },
      progress: 75, tags: ['UI', 'Theme'],
      subtasks: { total: 8, completed: 6 }
    },
    {
      id: 't12', title: 'Migrar a Angular 19',
      description: 'Actualizar dependencias y resolver breaking changes',
      status: 'backlog', priority: 'low',
      assignee: { name: 'María Torres', initials: 'MT', color: '#40916c' },
      progress: 0, tags: ['Infra', 'Upgrade']
    }
  ]);

  /** Signal reactivo con las anotaciones de revisión */
  annotations = signal<Annotation[]>([
    {
      id: 'a1', text: 'Cambiar la tipografía del título a Outfit Bold',
      author: { name: 'Ana López', initials: 'AL', color: '#1b4332' },
      urgency: 'critical', posX: 35, posY: 12,
      timestamp: new Date('2026-05-04T14:30:00'), resolved: false
    },
    {
      id: 'a2', text: 'Mejorar la resolución de la imagen del componente',
      author: { name: 'Carlos Ruiz', initials: 'CR', color: '#582f0e' },
      urgency: 'suggestion', posX: 55, posY: 52,
      timestamp: new Date('2026-05-04T15:15:00'), resolved: false
    },
    {
      id: 'a3', text: 'El contraste del texto gris no cumple WCAG AA',
      author: { name: 'María Torres', initials: 'MT', color: '#40916c' },
      urgency: 'critical', posX: 20, posY: 35,
      timestamp: new Date('2026-05-04T16:00:00'), resolved: false
    },
    {
      id: 'a4', text: 'Paleta de colores aprobada ✓',
      author: { name: 'Juan García', initials: 'JG', color: '#6366f1' },
      urgency: 'resolved', posX: 42, posY: 78,
      timestamp: new Date('2026-05-04T10:00:00'), resolved: true
    },
    {
      id: 'a5', text: 'Agregar sombra sutil a las tarjetas KPI',
      author: { name: 'Ana López', initials: 'AL', color: '#1b4332' },
      urgency: 'suggestion', posX: 70, posY: 25,
      timestamp: new Date('2026-05-05T09:00:00'), resolved: false
    },
    {
      id: 'a6', text: 'Revisar el espaciado del grid en tablet',
      author: { name: 'Carlos Ruiz', initials: 'CR', color: '#582f0e' },
      urgency: 'suggestion', posX: 15, posY: 60,
      timestamp: new Date('2026-05-05T09:30:00'), resolved: false
    }
  ]);

  /** Tareas agrupadas por estado */
  tasksByStatus = computed(() => {
    const all = this.tasks();
    return {
      'backlog': all.filter(t => t.status === 'backlog'),
      'todo': all.filter(t => t.status === 'todo'),
      'in-progress': all.filter(t => t.status === 'in-progress'),
      'done': all.filter(t => t.status === 'done'),
      'blocked': all.filter(t => t.status === 'blocked'),
    };
  });

  /** Mover tarea a un nuevo estado */
  moveTask(taskId: string, newStatus: Task['status']) {
    this.tasks.update(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    );
  }

  /** Resolver una anotación */
  resolveAnnotation(annotationId: string) {
    this.annotations.update(anns =>
      anns.map(a => a.id === annotationId ? { ...a, resolved: true, urgency: 'resolved' as const } : a)
    );
  }
}
