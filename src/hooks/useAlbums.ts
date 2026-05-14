import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Album } from '../types';

const STORAGE_KEY = '@listened_albums';

export function useAlbums() {
  const [listened, setListened] = useState<Album[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        setListened(JSON.parse(data));
      }
    });
  }, []);

  const markAsListened = useCallback(async (album: Album) => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const currentList: Album[] = data ? JSON.parse(data) : [];
    if (currentList.some((a) => a.id === album.id)) return;
    const updated = [...currentList, album];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setListened(updated);
  }, []);

  const addCustomAlbum = useCallback(async (albumData: Omit<Album, 'id'>) => {
    const newAlbum: Album = {
      id: Date.now().toString(),
      ...albumData,
    };
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const currentList: Album[] = data ? JSON.parse(data) : [];
    const updated = [newAlbum, ...currentList];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setListened(updated);
  }, []);

  return { listened, markAsListened, addCustomAlbum };
}
