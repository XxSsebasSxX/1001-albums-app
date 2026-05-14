import { supabase } from '../lib/supabase';
import albumsData from '../data/albums.json';
import type { Album } from '../types';

export async function migrateJsonToSupabase(
  onProgress?: (done: number, total: number) => void,
): Promise<{ inserted: number; errors: number }> {
  const albums = albumsData as Album[];
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < albums.length; i += batchSize) {
    const batch = albums.slice(i, i + batchSize);
    const { error } = await supabase.from('master_albums').insert(batch);
    if (error) {
      console.error('[migration] batch error:', error);
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
    onProgress?.(Math.min(i + batchSize, albums.length), albums.length);
  }

  return { inserted, errors };
}
