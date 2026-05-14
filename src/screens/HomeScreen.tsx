import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  StyleSheet,
} from 'react-native';
import { AnimatePresence, View as MotiView } from 'moti';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Album } from '../types';
import { colors } from '../theme/colors';
import { useAlbums } from '../hooks/useAlbums';
import albumsData from '../data/albums.json';
import AlbumCover from '../components/AlbumCover';
import { getAffiliateLink } from '../utils/affiliate';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { listened, markAsListened } = useAlbums();
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);

  const pickRandom = () => {
    const randomIndex = Math.floor(Math.random() * albumsData.length);
    setCurrentAlbum(albumsData[randomIndex]);
  };

  const isListened = currentAlbum
    ? listened.some((a) => a.id === currentAlbum.id)
    : false;

  return (
    <SafeAreaView style={styles.container}>
      <MotiView style={styles.inner}>
        <Text style={styles.title}>1001 Albums</Text>
        <Text style={styles.subtitle}>Descubre tu próxima obra maestra</Text>

        <TouchableOpacity style={styles.randomButton} onPress={pickRandom}>
          <Text style={styles.randomButtonText}>Generar Disco Aleatorio</Text>
        </TouchableOpacity>

        <AnimatePresence>
          {currentAlbum && (
            <MotiView
              key={currentAlbum.id}
              from={{ opacity: 0, translateY: 20, scale: 0.95 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'timing', duration: 400 }}
              style={styles.albumCard}
            >
              <AlbumCover artist={currentAlbum.artist} album={currentAlbum.album} size={250} />
              <Text style={styles.albumTitle}>{currentAlbum.album}</Text>
              <Text style={styles.albumArtist}>{currentAlbum.artist}</Text>
              <MotiView style={styles.metaRow}>
                <Text style={styles.albumMeta}>{currentAlbum.year}</Text>
                <Text style={styles.albumMeta}>{currentAlbum.genre}</Text>
              </MotiView>

              {!isListened && (
                <TouchableOpacity
                  style={styles.listenButton}
                  onPress={() => markAsListened(currentAlbum)}
                >
                  <Text style={styles.listenButtonText}>Marcar como Escuchado</Text>
                </TouchableOpacity>
              )}

              {isListened && (
                <Text style={styles.listenedBadge}>✓ Escuchado</Text>
              )}

              <View style={styles.affiliateRow}>
                <TouchableOpacity
                  style={styles.affiliateButton}
                  onPress={() =>
                    Linking.openURL(
                      getAffiliateLink(
                        currentAlbum.artist,
                        currentAlbum.album,
                        'amazon',
                      ),
                    )
                  }
                >
                  <Text style={styles.affiliateIcon}>🛒</Text>
                  <Text style={styles.affiliateText}>Comprar Vinilo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.affiliateButton}
                  onPress={() =>
                    Linking.openURL(
                      getAffiliateLink(
                        currentAlbum.artist,
                        currentAlbum.album,
                        'apple',
                      ),
                    )
                  }
                >
                  <Text style={styles.affiliateIcon}>🎵</Text>
                  <Text style={styles.affiliateText}>Escuchar en Apple</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        </AnimatePresence>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyButtonText}>Ver tu Colección</Text>
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 40,
  },
  randomButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 32,
  },
  randomButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  albumCard: {
    minHeight: 150,
    width: '90%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  albumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  albumArtist: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  albumMeta: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  listenButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  listenButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  listenedBadge: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  affiliateRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  affiliateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#1A1A1A',
    gap: 6,
  },
  affiliateIcon: {
    fontSize: 16,
  },
  affiliateText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  historyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  historyButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
