import { describe, it, expect, vi } from 'vitest';

vi.mock('../FormViewPlugin/components/FormView/FormView', () => ({ FormView: () => null }));
vi.mock('../FormViewPlugin/components/FormView/FormPreview', () => ({ FormPreview: () => null }));
vi.mock('../FormViewPlugin/components/FormView/RightPanel', () => ({ RightPanel: () => null }));
vi.mock('../FormViewPlugin/components/FormView/FieldsList', () => ({ FieldsList: () => null }));
vi.mock('../FormViewPlugin/components/FormView/SortableFieldItem', () => ({ SortableFieldItem: () => null }));
vi.mock('../FormViewPlugin/components/FormView/SortableFormField', () => ({ SortableFormField: () => null }));
vi.mock('../FormViewPlugin/components/shared/FieldRenderer', () => ({ default: () => null }));
vi.mock('../FormViewPlugin/components/shared/AppearanceSettings', () => ({ AppearanceSettings: () => null }));
vi.mock('../GalleryViewPlugin/components/GalleryView', () => ({ GalleryView: () => null }));
vi.mock('../GalleryViewPlugin/components/GalleryHeader', () => ({ GalleryHeader: () => null }));
vi.mock('../GalleryViewPlugin/components/GalleryCard', () => ({ GalleryCard: () => null }));
vi.mock('../KanbanViewPlugin/components/KanbanBoard/KanbanBoard', () => ({ default: () => null, KanbanBoard: () => null }));

describe('plugin barrel exports', () => {
  it('exports form view component barrels', async () => {
    const root = await import('../FormViewPlugin/components');
    const form = await import('../FormViewPlugin/components/FormView');
    const shared = await import('../FormViewPlugin/components/shared');

    expect(root).toHaveProperty('FormView');
    expect(form).toHaveProperty('FormPreview');
    expect(shared).toHaveProperty('AppearanceSettings');
  });

  it('exports gallery and kanban component barrels', async () => {
    const gallery = await import('../GalleryViewPlugin/components');
    const kanbanRoot = await import('../KanbanViewPlugin/components');
    const kanbanBoard = await import('../KanbanViewPlugin/components/KanbanBoard');

    expect(gallery).toHaveProperty('GalleryView');
    expect(kanbanRoot).toHaveProperty('KanbanBoard');
    expect(kanbanBoard).toHaveProperty('KanbanBoard');
  });
});

