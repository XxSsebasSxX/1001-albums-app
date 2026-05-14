import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Album } from '../types';
import { colors } from '../theme/colors';
import { useAlbums } from '../hooks/useAlbums';
import albumsData from '../data/albums.json';
import AlbumCover from '../components/AlbumCover';

const allAlbums: Album[] = albumsData;

function AlbumCard({ item }: { item: Album }) {
  return (
    <View style={styles.card}>
      <AlbumCover artist={item.artist} album={item.album} size={60} />
      <View style={styles.cardTextBlock}>
        <Text style={styles.cardAlbum}>{item.album}</Text>
        <Text style={styles.cardArtist}>{item.artist}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>{item.year || '?'}</Text>
          <Text style={styles.cardMeta}>{item.genre}</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { listened, markAsListened, addCustomAlbum } = useAlbums();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');

  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = allAlbums.filter(
      (a) =>
        a.album.toLowerCase().includes(query) ||
        a.artist.toLowerCase().includes(query),
    );
    return results.slice(0, 20);
  }, [searchQuery]);

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setYear('');
    setGenre('');
  };

  const cleanAll = () => {
    setSearchQuery('');
    setIsManualMode(false);
    resetForm();
  };

  const closeModal = () => {
    cleanAll();
    setIsModalVisible(false);
  };

  const handleSelectAlbum = (album: Album) => {
    markAsListened(album);
    closeModal();
  };

  const handleSave = () => {
    if (!title.trim() || !artist.trim()) return;
    addCustomAlbum({
      album: title.trim(),
      artist: artist.trim(),
      year: year ? parseInt(year, 10) : 0,
      genre: genre.trim() || 'Various',
    });
    closeModal();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tu Colección</Text>
          <Text style={styles.count}>
            {listened.length} {listened.length === 1 ? 'álbum escuchado' : 'álbumes escuchados'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Añadir</Text>
        </TouchableOpacity>
      </View>

      {listened.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no has escuchado nada</Text>
          <Text style={styles.emptySubtext}>
            Vuelve a inicio y descubre tu primer disco
          </Text>
        </View>
      ) : (
        <FlatList
          data={listened}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AlbumCard item={item} />}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.formCard}>
              {!isManualMode ? (
                <>
                  <Text style={styles.formTitle}>Buscar Álbum</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Escribe el nombre del álbum o artista..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />

                  {filteredAlbums.length > 0 && (
                    <FlatList
                      data={filteredAlbums}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.resultItem}
                          onPress={() => handleSelectAlbum(item)}
                        >
                          <AlbumCover artist={item.artist} album={item.album} size={50} />
                          <View style={styles.resultTextBlock}>
                            <Text style={styles.resultAlbum}>{item.album}</Text>
                            <Text style={styles.resultArtist}>{item.artist}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      style={styles.resultsList}
                      keyboardShouldPersistTaps="handled"
                    />
                  )}

                  {searchQuery.trim() && filteredAlbums.length === 0 && (
                    <Text style={styles.noResults}>
                      No encontramos ese disco en la lista oficial.
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.manualToggle}
                    onPress={() => setIsManualMode(true)}
                  >
                    <Text style={styles.manualToggleText}>
                      ¿No está en la lista? Añadir manualmente
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.formTitle}>Añadir Manualmente</Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Título del álbum"
                    placeholderTextColor={colors.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Artista"
                    placeholderTextColor={colors.textSecondary}
                    value={artist}
                    onChangeText={setArtist}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Año (opcional)"
                    placeholderTextColor={colors.textSecondary}
                    value={year}
                    onChangeText={setYear}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Género (opcional)"
                    placeholderTextColor={colors.textSecondary}
                    value={genre}
                    onChangeText={setGenre}
                  />

                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backToSearch}
                    onPress={() => setIsManualMode(false)}
                  >
                    <Text style={styles.backToSearchText}>Volver al buscador</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  count: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#0A0A0A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cardTextBlock: {
    flex: 1,
    marginLeft: 12,
  },
  cardAlbum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  cardArtist: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsList: {
    maxHeight: 280,
    marginTop: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultTextBlock: {
    flex: 1,
    marginLeft: 12,
  },
  resultAlbum: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  resultArtist: {
    fontSize: 13,
    color: colors.primary,
  },
  noResults: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  manualToggle: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  manualToggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  backToSearch: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backToSearchText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
