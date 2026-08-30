export async function uploadPhysicalFile(
  file: File, 
  folder: 'gallery' | 'documents' = 'gallery',
  title?: string,
  isGlobal: boolean = false
): Promise<{ url: string; fileName: string; size: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  if (title) {
    formData.append('title', title);
  }
  if (isGlobal) {
    formData.append('isGlobal', 'true');
  }

  const schoolId = localStorage.getItem('ceiba_active_school_id') || '';
  const schoolSlug = localStorage.getItem('ceiba_active_school_slug') || 'ceiba';

  const headers: Record<string, string> = {};
  if (schoolId) headers['x-school-id'] = schoolId;
  if (schoolSlug) headers['x-school-slug'] = schoolSlug;

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Error en el servidor (${res.status})` }));
    throw new Error(err.error || `Error en el servidor al subir archivo (${res.status})`);
  }

  const data = await res.json();
  if (!data.success || !data.url) {
    throw new Error(data.error || 'El servidor no devolvió la URL del archivo');
  }

  return {
    url: data.url,
    fileName: data.fileName,
    size: data.size,
  };
}

export async function deletePhysicalFile(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') return false;

  const schoolId = localStorage.getItem('ceiba_active_school_id') || '';
  const schoolSlug = localStorage.getItem('ceiba_active_school_slug') || 'ceiba';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (schoolId) headers['x-school-id'] = schoolId;
  if (schoolSlug) headers['x-school-slug'] = schoolSlug;

  try {
    const res = await fetch('/api/storage', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ url }),
    });

    return res.ok;
  } catch (e) {
    console.warn('Could not delete physical file on server', e);
    return false;
  }
}

export async function generateGalleryMetadata(params: {
  imageUrl?: string;
  categoryId?: string;
  categoryLabel?: string;
  existingTitle?: string;
  languages?: string[];
}): Promise<{
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  translations?: Record<string, { title: string; description: string }>;
  source?: string;
}> {
  const schoolId = localStorage.getItem('ceiba_active_school_id') || '';
  const schoolSlug = localStorage.getItem('ceiba_active_school_slug') || 'ceiba';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (schoolId) headers['x-school-id'] = schoolId;
  if (schoolSlug) headers['x-school-slug'] = schoolSlug;

  const res = await fetch('/api/gallery/generate-metadata', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al generar metadatos' }));
    throw new Error(err.error || 'Error al generar metadatos con IA');
  }

  return await res.json();
}

export async function fetchServerDB(): Promise<Uint8Array | null> {
  try {
    const res = await fetch('/api/db');
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.warn('Could not fetch server database file', e);
    return null;
  }
}

export async function syncServerDB(binaryArray: Uint8Array): Promise<boolean> {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: binaryArray,
    });
    return res.ok;
  } catch (e) {
    console.warn('Could not sync server database file', e);
    return false;
  }
}
