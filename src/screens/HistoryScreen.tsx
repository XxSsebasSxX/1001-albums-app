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
  Linking,
  StyleSheet,
} from 'react-native';
import { Album, ListenedAlbum } from '../types';
import { colors } from '../theme/colors';
import { useAlbums } from '../hooks/useAlbums';
import albumsData from '../data/albums.json';
import AlbumCover from '../components/AlbumCover';
import LoginScreen from './LoginScreen';
import { getAffiliateLink } from '../utils/affiliate';

const allAlbums: Album[] = albumsData;

function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Text style={[styles.star, n <= value && styles.starActive]}>
            {n <= value ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AlbumCard({
  item,
  onPress,
}: {
  item: ListenedAlbum;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <AlbumCover artist={item.artist} album={item.album} size={60} />
      <View style={styles.cardTextBlock}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardAlbum} numberOfLines={1}>
            {item.album}
          </Text>
          {item.rating > 0 && (
            <Text style={styles.cardRating}>{'★'.repeat(item.rating)}</Text>
          )}
        </View>
        <Text style={styles.cardArtist}>{item.artist}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMeta}>{item.year || '?'}</Text>
          <Text style={styles.cardMeta}>{item.genre}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const {
    listened,
    markAsListened,
    addCustomAlbum,
    updateAlbumNotes,
    user,
    syncLocalDataWithCloud,
  } = useAlbums();
  const [isLoginVisible, setIsLoginVisible] = useState(false);
  const [isAddVisible, setIsAddVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');

  const [journalAlbum, setJournalAlbum] = useState<ListenedAlbum | null>(null);
  const [journalRating, setJournalRating] = useState(0);
  const [journalNotes, setJournalNotes] = useState('');

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

  const cleanAdd = () => {
    setSearchQuery('');
    setIsManualMode(false);
    resetForm();
  };

  const closeAdd = () => {
    cleanAdd();
    setIsAddVisible(false);
  };

  const handleSelectAlbum = (album: Album) => {
    markAsListened(album);
    closeAdd();
  };

  const handleSaveCustom = () => {
    if (!title.trim() || !artist.trim()) return;
    addCustomAlbum({
      album: title.trim(),
      artist: artist.trim(),
      year: year ? parseInt(year, 10) : 0,
      genre: genre.trim() || 'Various',
    });
    closeAdd();
  };

  const openJournal = (item: ListenedAlbum) => {
    setJournalAlbum(item);
    setJournalRating(item.rating);
    setJournalNotes(item.notes);
  };

  const closeJournal = () => {
    setJournalAlbum(null);
  };

  const saveJournal = () => {
    if (!journalAlbum) return;
    updateAlbumNotes(journalAlbum.id, journalRating, journalNotes);
    closeJournal();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mi Diario</Text>
          <Text style={styles.count}>
            {listened.length} {listened.length === 1 ? 'álbum escuchado' : 'álbumes escuchados'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.cloudButton}
            onPress={() => setIsLoginVisible(true)}
          >
            <Text style={styles.cloudIcon}>
              {user ? '\u2601\uFE0F' : '\u26C5'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsAddVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Añadir</Text>
          </TouchableOpacity>
        </View>
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
          renderItem={({ item }) => (
            <AlbumCard item={item} onPress={() => openJournal(item)} />
          )}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <Text style={styles.disclaimer}>
              Como afiliado de Amazon, esta aplicación percibe ingresos por las
              compras adscritas que cumplen los requisitos aplicables.
            </Text>
          }
        />
      )}

      <Modal
        visible={isAddVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAdd}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeAdd}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={styles.formCard}
            >
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
                          <AlbumCover
                            artist={item.artist}
                            album={item.album}
                            size={50}
                          />
                          <View style={styles.resultTextBlock}>
                            <Text style={styles.resultAlbum}>{item.album}</Text>
                            <Text style={styles.resultArtist}>
                              {item.artist}
                            </Text>
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

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveCustom}
                  >
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backToSearch}
                    onPress={() => setIsManualMode(false)}
                  >
                    <Text style={styles.backToSearchText}>
                      Volver al buscador
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={!!journalAlbum}
        animationType="slide"
        transparent={true}
        onRequestClose={closeJournal}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeJournal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={styles.journalCard}
            >
              {journalAlbum && (
                <>
                  <AlbumCover
                    artist={journalAlbum.artist}
                    album={journalAlbum.album}
                    size={180}
                  />

                  <Text style={styles.journalAlbum}>
                    {journalAlbum.album}
                  </Text>
                  <Text style={styles.journalArtist}>
                    {journalAlbum.artist}
                  </Text>

                  <View style={styles.journalSection}>
                    <Text style={styles.journalLabel}>Tu puntuación</Text>
                    <StarSelector
                      value={journalRating}
                      onChange={setJournalRating}
                    />
                  </View>

                  <View style={styles.journalSection}>
                    <Text style={styles.journalLabel}>Tus notas</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Escribe tu reseña personal..."
                      placeholderTextColor={colors.textSecondary}
                      value={journalNotes}
                      onChangeText={setJournalNotes}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.affiliateRow}>
                    <TouchableOpacity
                      style={styles.affiliateButton}
                      onPress={() =>
                        Linking.openURL(
                          getAffiliateLink(
                            journalAlbum.artist,
                            journalAlbum.album,
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
                            journalAlbum.artist,
                            journalAlbum.album,
                            'apple',
                          ),
                        )
                      }
                    >
                      <Text style={styles.affiliateIcon}>🎵</Text>
                      <Text style={styles.affiliateText}>
                        Escuchar en Apple
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveJournal}
                  >
                    <Text style={styles.saveButtonText}>Guardar Notas</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      <LoginScreen
        visible={isLoginVisible}
        onClose={() => {
          setIsLoginVisible(false);
          if (user) {
            syncLocalDataWithCloud();
          }
        }}
      />
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cloudButton: {
    padding: 8,
  },
  cloudIcon: {
    fontSize: 20,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardAlbum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
    flexShrink: 1,
  },
  cardRating: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
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
    maxHeight: '80%',
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
  journalCard: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    maxHeight: '85%',
  },
  journalAlbum: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 16,
  },
  journalArtist: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 4,
    marginBottom: 16,
  },
  journalSection: {
    width: '100%',
    marginBottom: 16,
  },
  journalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  star: {
    fontSize: 32,
    color: colors.textSecondary,
  },
  starActive: {
    color: '#F5A623',
  },
  notesInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
  },
  affiliateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  disclaimer: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    lineHeight: 16,
  },
});
