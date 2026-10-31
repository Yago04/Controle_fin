interface CachedData<T> {
  timestamp: number;
  data: T;
}

interface CacheStore {
  gymCache: CachedData<any> | null;
  healthCache: CachedData<any> | null;
  exerciseMediaCache: Map<string, CachedData<any>>;
}

const globalForCache = globalThis as unknown as {
  __appGymCache?: CacheStore;
};

if (!globalForCache.__appGymCache) {
  globalForCache.__appGymCache = {
    gymCache: null,
    healthCache: null,
    exerciseMediaCache: new Map(),
  };
}

const cacheStore = globalForCache.__appGymCache;

const GYM_CACHE_TTL_MS = 60 * 1000; // 60s em memória
const HEALTH_CACHE_TTL_MS = 60 * 1000; // 60s em memória
const EXERCISE_MEDIA_TTL_MS = 24 * 60 * 60 * 1000; // 24h para mídia/fotos de exercícios

export function getCachedGymData(): any | null {
  if (!cacheStore.gymCache) return null;
  if (Date.now() - cacheStore.gymCache.timestamp > GYM_CACHE_TTL_MS) {
    cacheStore.gymCache = null;
    return null;
  }
  return cacheStore.gymCache.data;
}

export function setCachedGymData(data: any): void {
  cacheStore.gymCache = {
    timestamp: Date.now(),
    data,
  };
}

export function invalidateGymCache(): void {
  cacheStore.gymCache = null;
}

export function getCachedHealthData(): any | null {
  if (!cacheStore.healthCache) return null;
  if (Date.now() - cacheStore.healthCache.timestamp > HEALTH_CACHE_TTL_MS) {
    cacheStore.healthCache = null;
    return null;
  }
  return cacheStore.healthCache.data;
}

export function setCachedHealthData(data: any): void {
  cacheStore.healthCache = {
    timestamp: Date.now(),
    data,
  };
}

export function invalidateHealthCache(): void {
  cacheStore.healthCache = null;
}

export function getCachedExerciseMedia(key: string): any | null {
  const normalizedKey = key.trim().toLowerCase();
  const entry = cacheStore.exerciseMediaCache.get(normalizedKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > EXERCISE_MEDIA_TTL_MS) {
    cacheStore.exerciseMediaCache.delete(normalizedKey);
    return null;
  }
  return entry.data;
}

export function setCachedExerciseMedia(key: string, data: any): void {
  const normalizedKey = key.trim().toLowerCase();
  cacheStore.exerciseMediaCache.set(normalizedKey, {
    timestamp: Date.now(),
    data,
  });
}
