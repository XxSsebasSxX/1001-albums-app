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

function fromRow(row: Record<string, unknown>): ListenedAlbum {
  return {
    id: row.album_id as string,
    artist: row.artist as string,
    album: row.album as string,
    year: (row.year as number) || 0,
    genre: (row.genre as string) || 'Various',
    rating: (row.rating as number) ?? 0,
    notes: (row.notes as string) ?? '',
  };
}

export function useAlbums() {
  const [listened, setListened] = useState<ListenedAlbum[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const fetchCloudData = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_albums')
      .select('*')
      .eq('user_id', user.id);
    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return;
    }
    setListened((data ?? []).map(fromRow));
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCloudData();
    } else if (!loading) {
      AsyncStorage.getItem(STORAGE_KEY).then((data) => {
        if (data) {
          setListened(JSON.parse(data).map(migrateEntry));
        }
      });
    }
  }, [user, loading, fetchCloudData]);

  const markAsListened = useCallback(
    async (album: Album) => {
      const newEntry: ListenedAlbum = { ...album, rating: 0, notes: '' };

      if (user) {
        const { error } = await supabase
          .from('user_albums')
          .upsert(toRow(newEntry, user.id), { onConflict: 'user_id,album_id' });
        if (error) {
          Alert.alert('Error al guardar', error.message);
          return;
        }
        setListened((prev) => {
          if (prev.some((a) => a.id === newEntry.id)) return prev;
          return [...prev, newEntry];
        });
      } else {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        const currentList: ListenedAlbum[] = data
          ? JSON.parse(data).map(migrateEntry)
          : [];
        if (currentList.some((a) => a.id === newEntry.id)) return;
        const updated = [...currentList, newEntry];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setListened(updated);
      }
    },
    [user],
  );

  const addCustomAlbum = useCallback(
    async (albumData: Omit<Album, 'id'>) => {
      const newEntry: ListenedAlbum = {
        id: Date.now().toString(),
        ...albumData,
        rating: 0,
        notes: '',
      };

      if (user) {
        const { error } = await supabase
          .from('user_albums')
          .upsert(toRow(newEntry, user.id), { onConflict: 'user_id,album_id' });
        if (error) {
          Alert.alert('Error al guardar', error.message);
          return;
        }
        setListened((prev) => [newEntry, ...prev]);
      } else {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        const currentList: ListenedAlbum[] = data
          ? JSON.parse(data).map(migrateEntry)
          : [];
        const updated = [newEntry, ...currentList];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setListened(updated);
      }
    },
    [user],
  );

  const updateAlbumNotes = useCallback(
    async (id: string, rating: number, notes: string) => {
      if (user) {
        const { error } = await supabase
          .from('user_albums')
          .update({ rating, notes })
          .eq('user_id', user.id)
          .eq('album_id', id);
        if (error) {
          Alert.alert('Error al actualizar', error.message);
          return;
        }
      } else {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        const currentList: ListenedAlbum[] = data
          ? JSON.parse(data).map(migrateEntry)
          : [];
        const updated = currentList.map((a) =>
          a.id === id ? { ...a, rating, notes } : a,
        );
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      setListened((prev) =>
        prev.map((a) => (a.id === id ? { ...a, rating, notes } : a)),
      );
    },
    [user],
  );

  const syncLocalDataWithCloud = useCallback(async () => {
    if (!user) return;
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return;
    const local: ListenedAlbum[] = JSON.parse(data).map(migrateEntry);
    if (local.length === 0) return;

    const { error } = await supabase.from('user_albums').upsert(
      local.map((a) => toRow(a, user.id)),
      { onConflict: 'user_id,album_id' },
    );
    if (error) {
      Alert.alert('Error al sincronizar', error.message);
      return;
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
    await fetchCloudData();
  }, [user, fetchCloudData]);

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
