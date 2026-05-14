import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Album, ListenedAlbum } from '../types';
import type { User } from '@supabase/supabase-js';

const STORAGE_KEY = '@listened_albums';

function migrateEntry(entry: Record<string, unknown>): ListenedAlbum {
  const status = entry.status as string;
  return {
    id: entry.id as string,
    artist: entry.artist as string,
    album: entry.album as string,
    year: (entry.year as number) || 0,
    genre: (entry.genre as string) || 'Various',
    rating: (entry.rating as number) ?? 0,
    notes: (entry.notes as string) ?? '',
    status: status === 'pending' ? 'pending' : 'listened',
  };
}

// Supabase table columns: user_id, album_id, artist, album, year, genre, rating, notes, status
function toRow(a: ListenedAlbum, userId: string) {
  return {
    user_id: userId,
    album_id: a.id,
    artist: a.artist,
    album: a.album,
    year: a.year,
    genre: a.genre,
    rating: a.rating,
    notes: a.notes,
    status: a.status,
  };
}

function fromRow(row: Record<string, unknown>, fallback: ListenedAlbum): ListenedAlbum {
  const status = row.status as string;
  return {
    ...fallback,
    id: row.album_id as string,
    artist: row.artist as string,
    album: row.album as string,
    year: (row.year as number) || fallback.year || 0,
    genre: (row.genre as string) || fallback.genre || 'Various',
    rating: (row.rating as number) ?? 0,
    notes: (row.notes as string) ?? '',
    status: status === 'pending' ? 'pending' : 'listened',
  };
}

export function useAlbums() {
  const [listened, setListened] = useState<ListenedAlbum[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Auth listener ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // ── Local helper: set state + console.table ────────────
  const emit = useCallback((next: ListenedAlbum[]) => {
    setListened(next);
    console.table(next.map((a) => ({ id: a.id, album: a.album, artist: a.artist, rating: a.rating })));
  }, []);

  // ── Fetch cloud, merge with local, update state ────────
  const fetchAndMerge = useCallback(async (uid: string) => {
    // Snapshot local data so year/genre survive the merge
    const localRaw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = localRaw
      ? JSON.parse(localRaw).map(migrateEntry)
      : [];

    try {
      const { data, error, status, statusText } = await supabase
        .from('user_albums')
        .select('*')
        .eq('user_id', uid);

      console.log('Supabase fetch:', { data, error, status, statusText });

      if (error) {
        console.warn('Supabase fetch error:', error.message, error.details);
        return;
      }

      const cloudAlbums = (data ?? []).map((row: Record<string, unknown>) => {
        const match = local.find((l) => l.id === row.album_id);
        const fallbackStatus = (row.status as string) === 'pending' ? 'pending' : 'listened';
        const fallback: ListenedAlbum = match ?? {
          id: row.album_id as string,
          artist: '',
          album: '',
          year: 0,
          genre: 'Various',
          rating: 0,
          notes: '',
          status: fallbackStatus,
        };
        return fromRow(row, fallback);
      });

      // Keep local-only entries that haven't been synced yet
      const cloudIds = new Set(cloudAlbums.map((a) => a.id));
      const localOnly = local.filter((l) => !cloudIds.has(l.id));
      const merged = [...cloudAlbums, ...localOnly];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      emit(merged);
    } catch (err) {
      console.warn('Supabase fetch exception:', err);
    }
  }, [emit]);

  // ── Load local → then cloud ────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const local = JSON.parse(raw).map(migrateEntry);
        console.log(`[boot] loaded ${local.length} from AsyncStorage`);
        emit(local);
      }
    });
  }, []); // only on mount

  useEffect(() => {
    if (user) fetchAndMerge(user.id);
  }, [user, fetchAndMerge]);

  // ── Derived lists ────────────────────────────────────
  const listenedAlbums = useMemo(() => listened.filter((a) => a.status === 'listened'), [listened]);
  const pendingAlbums = useMemo(() => listened.filter((a) => a.status === 'pending'), [listened]);

  // ── Stats ────────────────────────────────────────────
  const statsData = useMemo(() => {
    const listenedOnly = listenedAlbums;

    const total = listenedOnly.length;
    const avgRating =
      total > 0
        ? listenedOnly.reduce((s, a) => s + a.rating, 0) / total
        : 0;

    // Decades
    const decades: Record<string, number> = {};
    for (const a of listenedOnly) {
      if (a.year > 0) {
        const d = `${Math.floor(a.year / 10) * 10}s`;
        decades[d] = (decades[d] || 0) + 1;
      }
    }
    const decadeLabels = Object.keys(decades).sort();
    const decadeData = decadeLabels.map((l) => decades[l]);

    // Genres
    const genres: Record<string, number> = {};
    for (const a of listenedOnly) {
      const g = a.genre || 'Various';
      genres[g] = (genres[g] || 0) + 1;
    }
    const sortedGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]);
    const topGenres3 = sortedGenres.slice(0, 3);
    const genreColors = ['#F5A623', '#4CAF50', '#2196F3', '#E53935', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];
    const genreChartData = sortedGenres.slice(0, 8).map(([name, count], i) => ({
      name: name.length > 12 ? name.slice(0, 12) + '…' : name,
      count,
      color: genreColors[i % genreColors.length],
      legendFontColor: '#AAAAAA',
      legendFontSize: 11,
    }));

    // Top artists
    const artists: Record<string, number> = {};
    for (const a of listenedOnly) {
      artists[a.artist] = (artists[a.artist] || 0) + 1;
    }
    const topArtists5 = Object.entries(artists)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      avgRating,
      decadeLabels,
      decadeData,
      genreChartData,
      topGenres3,
      topArtists5,
    };
  }, [listenedAlbums]);

  // ═══════════════════════════════════════════════════════
  //  WRITE OPERATIONS — always local first, then cloud
  // ═══════════════════════════════════════════════════════

  const lookupAlbum = useCallback(async (albumId: string): Promise<Album | null> => {
    try {
      const { data } = await supabase
        .from('master_albums')
        .select('*')
        .eq('id', albumId)
        .single();
      if (data) return data as Album;
    } catch {
      // fallback below
    }
    const { default: albumsData } = await import('../data/albums.json');
    return (albumsData as Album[]).find((a) => a.id === albumId) ?? null;
  }, []);

  const upsertLocally = useCallback(async (entry: ListenedAlbum) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = raw ? JSON.parse(raw).map(migrateEntry) : [];
    const idx = local.findIndex((a) => a.id === entry.id);
    const next = idx >= 0
      ? local.map((a) => (a.id === entry.id ? entry : a))
      : [...local, entry];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit(next);
    return next;
  }, [emit]);

  const syncToSupabase = useCallback(async (entry: ListenedAlbum) => {
    if (!user) return;
    try {
      const { data, error, status, statusText } = await supabase
        .from('user_albums')
        .upsert(toRow(entry, user.id), { onConflict: 'user_id,album_id' });
      console.log('[Supabase sync]', { data, error, status, statusText });
      if (error) Alert.alert('Error de sincronización', error.message);
    } catch (err) {
      console.warn('[Supabase sync] exception:', err);
    }
  }, [user]);

  const addToPending = useCallback(async (albumId: string) => {
    console.log('[addToPending]', albumId);

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = raw ? JSON.parse(raw).map(migrateEntry) : [];

    const existing = local.find((a) => a.id === albumId);
    if (existing) {
      if (existing.status === 'pending') {
        console.log('[addToPending] already pending, skipping');
        return;
      }
      if (existing.status === 'listened') {
        console.log('[addToPending] already listened, skipping');
        return;
      }
    }

    const albumData = await lookupAlbum(albumId);
    if (!albumData) {
      Alert.alert('Error', 'No se encontró el álbum en la base de datos.');
      return;
    }

    const entry: ListenedAlbum = { ...albumData, rating: 0, notes: '', status: 'pending' };
    await upsertLocally(entry);
    await syncToSupabase(entry);
  }, [lookupAlbum, upsertLocally, syncToSupabase]);

  const markAsListened = useCallback(async (albumId: string) => {
    console.log('[markAsListened]', albumId);

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = raw ? JSON.parse(raw).map(migrateEntry) : [];

    const existing = local.find((a) => a.id === albumId);
    if (existing?.status === 'listened') {
      console.log('[markAsListened] already listened, skipping');
      return;
    }

    if (existing?.status === 'pending') {
      // Promote from pending → listened
      const entry: ListenedAlbum = { ...existing, status: 'listened' };
      await upsertLocally(entry);
      await syncToSupabase(entry);
      return;
    }

    const albumData = await lookupAlbum(albumId);
    if (!albumData) {
      Alert.alert('Error', 'No se encontró el álbum en la base de datos.');
      return;
    }

    const entry: ListenedAlbum = { ...albumData, rating: 0, notes: '', status: 'listened' };
    await upsertLocally(entry);
    await syncToSupabase(entry);
  }, [lookupAlbum, upsertLocally, syncToSupabase]);

  const markPendingAsListened = useCallback(async (albumId: string, rating: number, notes: string) => {
    console.log('[markPendingAsListened]', albumId);

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = raw ? JSON.parse(raw).map(migrateEntry) : [];
    const entry = local.find((a) => a.id === albumId);
    if (!entry || entry.status !== 'pending') return;

    const updated: ListenedAlbum = { ...entry, status: 'listened', rating, notes };
    await upsertLocally(updated);
    await syncToSupabase(updated);
  }, [upsertLocally, syncToSupabase]);

  const addCustomAlbum = useCallback(async (albumData: Omit<Album, 'id'>) => {
    const entry: ListenedAlbum = {
      id: Date.now().toString(),
      ...albumData,
      rating: 0,
      notes: '',
      status: 'listened',
    };
    await upsertLocally(entry);
    await syncToSupabase(entry);
  }, [upsertLocally, syncToSupabase]);

  const updateAlbumNotes = useCallback(async (id: string, rating: number, notes: string) => {
    console.log('[updateAlbumNotes]', id, rating);

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = raw ? JSON.parse(raw).map(migrateEntry) : [];
    const next = local.map((a) =>
      a.id === id ? { ...a, rating, notes } : a,
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit(next);

    if (!user) return;
    try {
      const { data, error, status, statusText } = await supabase
        .from('user_albums')
        .update({ rating, notes })
        .eq('user_id', user.id)
        .eq('album_id', id);
      console.log('[Supabase update]', { data, error, status, statusText });
      if (error) Alert.alert('Error de sincronización', error.message);
    } catch (err) {
      console.warn('[Supabase update] exception:', err);
    }
  }, [user, emit]);

  const removeAlbum = useCallback(async (albumId: string) => {
    console.log('[removeAlbum]', albumId);

    // 1. Remove from local
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = raw ? JSON.parse(raw).map(migrateEntry) : [];
    const next = local.filter((a) => a.id !== albumId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit(next);

    // 2. If logged in, remove from Supabase
    if (!user) return;
    try {
      const { data, error, status, statusText } = await supabase
        .from('user_albums')
        .delete()
        .eq('user_id', user.id)
        .eq('album_id', albumId);
      console.log('[Supabase delete]', { data, error, status, statusText });
      if (error) Alert.alert('Error de sincronización', error.message);
    } catch (err) {
      console.warn('[Supabase delete] exception:', err);
    }
  }, [user, emit]);

  const syncLocalDataWithCloud = useCallback(async () => {
    if (!user) return;
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const local: ListenedAlbum[] = JSON.parse(raw).map(migrateEntry);
    if (local.length === 0) return;

    console.log('[syncLocalDataWithCloud] pushing', local.length, 'entries');
    try {
      const { data, error, status, statusText } = await supabase
        .from('user_albums')
        .upsert(local.map((a) => toRow(a, user.id)), { onConflict: 'user_id,album_id' });
      console.log('[Supabase sync]', { data, error, status, statusText });
      if (error) {
        Alert.alert('Error al sincronizar', error.message);
        return;
      }
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('[syncLocalDataWithCloud] local cleared');
      await fetchAndMerge(user.id);
    } catch (err) {
      console.warn('[Supabase sync] exception:', err);
    }
  }, [user, fetchAndMerge]);

  return {
    listened,
    listenedAlbums,
    pendingAlbums,
    statsData,
    user,
    loading,
    addToPending,
    markAsListened,
    markPendingAsListened,
    addCustomAlbum,
    updateAlbumNotes,
    removeAlbum,
    syncLocalDataWithCloud,
  };
}
