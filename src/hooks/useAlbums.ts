import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Album, ListenedAlbum } from '../types';

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

export function useAlbums() {
  const [listened, setListened] = useState<ListenedAlbum[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        const parsed: Record<string, unknown>[] = JSON.parse(data);
        setListened(parsed.map(migrateEntry));
      }
    });
  }, []);

  const markAsListened = useCallback(async (album: Album) => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const currentList: ListenedAlbum[] = data ? JSON.parse(data).map(migrateEntry) : [];
    if (currentList.some((a) => a.id === album.id)) return;
    const newEntry: ListenedAlbum = { ...album, rating: 0, notes: '' };
    const updated = [...currentList, newEntry];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setListened(updated);
  }, []);

  const addCustomAlbum = useCallback(async (albumData: Omit<Album, 'id'>) => {
    const newEntry: ListenedAlbum = {
      id: Date.now().toString(),
      ...albumData,
      rating: 0,
      notes: '',
    };
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const currentList: ListenedAlbum[] = data ? JSON.parse(data).map(migrateEntry) : [];
    const updated = [newEntry, ...currentList];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setListened(updated);
  }, []);

  const updateAlbumNotes = useCallback(async (id: string, rating: number, notes: string) => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const currentList: ListenedAlbum[] = data ? JSON.parse(data).map(migrateEntry) : [];
    const updated = currentList.map((a) =>
      a.id === id ? { ...a, rating, notes } : a,
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setListened(updated);
  }, []);

  return { listened, markAsListened, addCustomAlbum, updateAlbumNotes };
}
