import { useState, useEffect } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';

interface AlbumCoverProps {
  artist: string;
  album: string;
  size?: number;
}

export default function AlbumCover({ artist, album, size = 200 }: AlbumCoverProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
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
        setIsLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [artist, album]);

  if (isLoading) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: 8 }]}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (imageUrl && !hasError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: 8 }}
        onError={() => setHasError(true)}
      />
    );
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
  container: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
