export async function uploadPhysicalFile(
  file: File, 
  folder: 'gallery' | 'documents',
  title?: string
): Promise<{ url: string; fileName: string; size: number }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  if (title) {
    formData.append('title', title);
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Error en el servidor al subir archivo (${res.status})`);
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
  if (!url || (!url.startsWith('/gallery/') && !url.startsWith('/documents/'))) {
    return false;
  }

  try {
    const res = await fetch('/api/file', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    return res.ok;
  } catch (e) {
    console.warn('Could not delete physical file on server', e);
    return false;
  }
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
