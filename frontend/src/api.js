const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchEntries() {
  const response = await fetch(`${API_BASE_URL}/entries`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch entries (Status ${response.status})`);
  }
  return response.json();
}

export async function fetchEntryById(id) {
  const response = await fetch(`${API_BASE_URL}/entries/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch entry #${id} (Status ${response.status})`);
  }
  return response.json();
}

export async function createEntry(text) {
  const response = await fetch(`${API_BASE_URL}/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error submitting entry (Status ${response.status})`);
  }

  return response.json();
}

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) return { healthy: false };
    const data = await response.json();
    return { healthy: true, ...data };
  } catch {
    return { healthy: false };
  }
}
