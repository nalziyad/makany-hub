// Storage adapter
// In Claude Artifacts: uses window.storage API
// In production (Vercel): uses localStorage

const isArtifact = typeof window !== 'undefined' && typeof window.storage !== 'undefined';

export const storage = {
  async get(key) {
    if (isArtifact) {
      return window.storage.get(key);
    }
    try {
      const value = localStorage.getItem(key);
      if (value === null) throw new Error('not found');
      return { key, value };
    } catch {
      return null;
    }
  },
  async set(key, value) {
    if (isArtifact) {
      return window.storage.set(key, value);
    }
    try {
      localStorage.setItem(key, value);
      return { key, value };
    } catch {
      return null;
    }
  },
};
