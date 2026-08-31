import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGalleries,
  createGallery,
  deleteGallery,
  getGalleryImages,
} from '@/lib/sqlite';

describe('example', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});

describe('Photo Galleries Management (Units & Web Gallery)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch galleries and map default and custom units', async () => {
    const mockGalleries = [
      {
        id: 'default_web_school_1',
        schoolId: 'school_1',
        name: 'Galería Web',
        description: 'Fotografías oficiales de la web escolar',
        coverImage: '',
        isDefault: true,
        showOnWeb: true,
        imageCount: 12,
        createdAt: '2026-08-30T10:00:00Z',
        updatedAt: '2026-08-30T10:00:00Z',
      },
      {
        id: 'gal_spring_2026',
        schoolId: 'school_1',
        name: 'Festival de Primavera 2026',
        description: 'Actividades al aire libre de los salones',
        coverImage: '/api/storage/schools/school_1/public/gallery/spring.jpg',
        isDefault: false,
        showOnWeb: false,
        imageCount: 5,
        createdAt: '2026-08-30T11:00:00Z',
        updatedAt: '2026-08-30T11:00:00Z',
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGalleries
    });

    const result = await getGalleries();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Galería Web');
    expect(result[0].is_default).toBe(true);
    expect(result[0].image_count).toBe(12);

    expect(result[1].name).toBe('Festival de Primavera 2026');
    expect(result[1].is_default).toBe(false);
    expect(result[1].image_count).toBe(5);
  });

  it('should create a custom photo gallery', async () => {
    const newGallery = {
      id: 'gal_grad_2026',
      schoolId: 'school_1',
      name: 'Graduación 2026',
      description: 'Ceremonia de fin de ciclo',
      coverImage: '/api/storage/schools/school_1/public/gallery/grad.jpg',
      isDefault: false,
      showOnWeb: true,
      imageCount: 0,
      createdAt: '2026-08-30T12:00:00Z',
      updatedAt: '2026-08-30T12:00:00Z',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => newGallery
    });

    const created = await createGallery({
      name: 'Graduación 2026',
      description: 'Ceremonia de fin de ciclo',
      cover_image: '/api/storage/schools/school_1/public/gallery/grad.jpg',
      show_on_web: true,
    });

    expect(created.id).toBe('gal_grad_2026');
    expect(created.name).toBe('Graduación 2026');
    expect(created.show_on_web).toBe(true);
    expect(created.is_default).toBe(false);
  });

  it('should disallow deleting the permanent default Galería Web with a descriptive error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'La "Galería Web" del sistema es permanente y no puede ser eliminada.'
      })
    });

    await expect(deleteGallery('default_web_school_1')).rejects.toThrow(
      'La "Galería Web" del sistema es permanente y no puede ser eliminada.'
    );
  });

  it('should support filtering gallery images by galleryId', async () => {
    const mockImages = [
      {
        id: 'img_1',
        schoolId: 'school_1',
        galleryId: 'gal_spring_2026',
        categoryId: 'practical',
        src: '/api/storage/schools/school_1/public/gallery/img1.jpg',
        title: 'Lavado de Manos en el Patio',
        description: 'Actividad de vida práctica',
        createdAt: '2026-08-30T10:00:00Z',
        gallery: {
          id: 'gal_spring_2026',
          name: 'Festival de Primavera 2026',
          isDefault: false,
          showOnWeb: false
        }
      }
    ];

    let requestedUrl = '';
    global.fetch = vi.fn().mockImplementation((url: string) => {
      requestedUrl = url;
      return Promise.resolve({
        ok: true,
        json: async () => mockImages
      });
    });

    const images = await getGalleryImages('practical', undefined, 'gal_spring_2026');
    expect(requestedUrl).toContain('categoryId=practical');
    expect(requestedUrl).toContain('galleryId=gal_spring_2026');
    expect(images).toHaveLength(1);
    expect(images[0].gallery_id).toBe('gal_spring_2026');
    expect(images[0].gallery?.name).toBe('Festival de Primavera 2026');
  });
});
