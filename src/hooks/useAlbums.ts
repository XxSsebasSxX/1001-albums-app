import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Album, ListenedAlbum } from '../types';
import type { User } from '@supabase/supabase-js';

const STORAGE_KEY = '@listened_albums';

function migrateEntry(entry: Record<string, unknown>): ListenedAlbum {
  return {
    id: entry.id as string,
    artist: entry.artist as string,
    album: entry.album as string,
    year: (entry.year as number) || 0,
    genre: (entry.genre as string) || 'Various',
    rating: (entry.rating as number) ?? 0,
    notes: (entry.notes as string) ?? '',
  };
}

// Supabase table columns: user_id, album_id, artist, album, year, genre, rating, notes
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
  };
}

function fromRow(row: Record<string, unknown>, fallback: ListenedAlbum): ListenedAlbum {
  return {
    ...fallback,
    id: row.album_id as string,
    artist: row.artist as string,
    album: row.album as string,
    year: (row.year as number) || fallback.year || 0,
    genre: (row.genre as string) || fallback.genre || 'Various',
    rating: (row.rating as number) ?? 0,
    notes: (row.notes as string) ?? '',
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
        const fallback: ListenedAlbum = match ?? {
          id: row.album_id as string,
          artist: '',
          album: '',
          year: 0,
          genre: 'Various',
          rating: 0,
          notes: '',
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

  // ═══════════════════════════════════════════════════════
  //  WRITE OPERATIONS — always local first, then cloud
  // ═══════════════════════════════════════════════════════

  const markAsListened = useCallback(async (album: Album) => {
    const entry: ListenedAlbum = { ...album, rating: 0, notes: '' };
    console.log('[markAsListened]', entry.id, entry.album);

    // 1. Always save locally
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = raw ? JSON.parse(raw).map(migrateEntry) : [];
    if (local.some((a) => a.id === entry.id)) {
      console.log('[markAsListened] already saved, skipping');
      return;
    }
    const next = [...local, entry];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit(next);

    // 2. If logged in, sync to Supabase
    if (!user) return;
    try {
      const { data, error, status, statusText } = await supabase
        .from('user_albums')
        .upsert(toRow(entry, user.id), { onConflict: 'user_id,album_id' });
      console.log('[Supabase upsert]', { data, error, status, statusText });
      if (error) Alert.alert('Error de sincronización', error.message);
    } catch (err) {
      console.warn('[Supabase upsert] exception:', err);
    }
  }, [user, emit]);

  const addCustomAlbum = useCallback(async (albumData: Omit<Album, 'id'>) => {
    const entry: ListenedAlbum = {
      id: Date.now().toString(),
      ...albumData,
      rating: 0,
      notes: '',
    };
    console.log('[addCustomAlbum]', entry.id, entry.album);

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const local: ListenedAlbum[] = raw ? JSON.parse(raw).map(migrateEntry) : [];
    const next = [entry, ...local];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit(next);

    if (!user) return;
    try {
      const { data, error, status, statusText } = await supabase
        .from('user_albums')
        .upsert(toRow(entry, user.id), { onConflict: 'user_id,album_id' });
      console.log('[Supabase upsert]', { data, error, status, statusText });
      if (error) Alert.alert('Error de sincronización', error.message);
    } catch (err) {
      console.warn('[Supabase upsert] exception:', err);
    }
  }, [user, emit]);

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
    user,
    loading,
    markAsListened,
    addCustomAlbum,
    updateAlbumNotes,
    syncLocalDataWithCloud,
  };
}
