import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';
import AlbumImageWithSkeleton from './AlbumImageWithSkeleton';

interface AlbumCoverProps {
  artist: string;
  album: string;
  size?: number;
}

export default function AlbumCover({ artist, album, size = 200 }: AlbumCoverProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setImageUrl(null);
    setHasError(false);

    const term = encodeURIComponent(`${artist} ${album}`);
    fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.results?.length > 0) {
          const url = (data.results[0].artworkUrl100 as string).replace(
            '100x100bb.jpg',
            '600x600bb.jpg',
          );
          setImageUrl(url);
        }
      })
      .catch(() => {
        if (mounted) setHasError(true);
      });

    return () => {
      mounted = false;
    };
  }, [artist, album]);

  if (imageUrl && !hasError) {
    return <AlbumImageWithSkeleton source={{ uri: imageUrl }} size={size} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: 8 }]}>
      <Text style={[styles.fallbackText, { fontSize: Math.max(10, size * 0.1) }]} numberOfLines={3}>
        {album}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fallbackText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
