import { useState, useRef, useEffect } from 'react';
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
  Alert,
  LayoutAnimation,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Album, ListenedAlbum } from '../types';
import { colors } from '../theme/colors';
import { useAlbums } from '../hooks/useAlbums';
import { supabase } from '../lib/supabase';
import AlbumCover from '../components/AlbumCover';
import { getAffiliateLink } from '../utils/affiliate';

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
  onDelete,
  onQuickListen,
}: {
  item: ListenedAlbum;
  onPress: () => void;
  onDelete: () => void;
  onQuickListen?: () => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        swipeRef.current?.close();
        onDelete();
      }}
    >
      <Text style={styles.deleteActionText}>🗑️</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions}>
      <View>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
          <AlbumCover artist={item.artist} album={item.album} size={60} />
          <View style={styles.cardTextBlock}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardAlbum} numberOfLines={1}>
                {item.album}
              </Text>
              {item.status === 'pending' && (
                <Text style={styles.pendingTag}>⏳</Text>
              )}
              {item.status === 'listened' && item.rating > 0 && (
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
        {item.status === 'pending' && onQuickListen && (
          <TouchableOpacity
            style={styles.quickListenButton}
            onPress={onQuickListen}
          >
            <Text style={styles.quickListenText}>✓ Marcar como escuchado</Text>
          </TouchableOpacity>
        )}
      </View>
    </Swipeable>
  );
}

export default function HistoryScreen() {
  const {
    listenedAlbums,
    pendingAlbums,
    addToPending,
    markAsListened,
    markPendingAsListened,
    addCustomAlbum,
    updateAlbumNotes,
    removeAlbum,
  } = useAlbums();
  const [activeTab, setActiveTab] = useState<'listened' | 'pending'>('listened');
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
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await supabase
          .from('master_albums')
          .select('*')
          .ilike('album', `%${q}%`)
          .limit(20);
        setSearchResults((data ?? []) as Album[]);
      } catch {
        setSearchResults([]);
      }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
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

  const handleMarkAsListened = (album: Album) => {
    markAsListened(album.id);
    closeAdd();
  };

  const handleAddToPending = (album: Album) => {
    addToPending(album.id);
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
    if (journalAlbum.status === 'pending') {
      markPendingAsListened(journalAlbum.id, journalRating, journalNotes);
    } else {
      updateAlbumNotes(journalAlbum.id, journalRating, journalNotes);
    }
    closeJournal();
  };

  const confirmDeleteAlbum = (album: ListenedAlbum) => {
    const executeDelete = () => {
      if (Platform.OS !== 'web') {
        try {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch {
          // LayoutAnimation no está disponible en esta plataforma
        }
      }
      removeAlbum(album.id);
      if (journalAlbum?.id === album.id) {
        closeJournal();
      }
    };

    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`¿Seguro que quieres eliminar "${album.album}" de ${album.artist}?`)) {
        executeDelete();
      }
      return;
    }

    Alert.alert(
      'Eliminar del diario',
      `¿Seguro que quieres eliminar "${album.album}" de ${album.artist}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: executeDelete,
        },
      ],
    );
  };

  const currentList = activeTab === 'listened' ? listenedAlbums : pendingAlbums;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mi Diario</Text>
          <Text style={styles.count}>
            {listenedAlbums.length + pendingAlbums.length} discos
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Añadir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'listened' && styles.tabActive]}
          onPress={() => setActiveTab('listened')}
        >
          <Text style={[styles.tabText, activeTab === 'listened' && styles.tabTextActive]}>
            Escuchados ({listenedAlbums.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pendientes ({pendingAlbums.length})
          </Text>
        </TouchableOpacity>
      </View>

      {currentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === 'listened' ? 'Aún no has escuchado nada' : 'No tienes discos pendientes'}
          </Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'listened'
              ? 'Vuelve a inicio y descubre tu primer disco'
              : 'Marca discos como pendientes desde el buscador'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlbumCard
              item={item}
              onPress={() => openJournal(item)}
              onDelete={() => confirmDeleteAlbum(item)}
              onQuickListen={
                item.status === 'pending'
                  ? () => {
                      markAsListened(item.id);
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    }
                  : undefined
              }
            />
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

                  {searchLoading && (
                    <Text style={styles.searchStatus}>Buscando...</Text>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <View>
                          <View style={styles.resultItem}>
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
                          </View>
                          <View style={styles.resultActions}>
                            <TouchableOpacity
                              style={styles.resultListenButton}
                              onPress={() => handleMarkAsListened(item)}
                            >
                              <Text style={styles.resultListenText}>✓ Escuchado</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.resultPendingButton}
                              onPress={() => handleAddToPending(item)}
                            >
                              <Text style={styles.resultPendingText}>⏳ Pendiente</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      style={styles.resultsList}
                      keyboardShouldPersistTaps="handled"
                    />
                  )}

                  {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
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
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeJournal}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.journalCard}>
              {journalAlbum && (
                <>
                  <View style={styles.journalHeaderRow}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={closeJournal}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                      style={styles.journalDeleteButton}
                      onPress={() => confirmDeleteAlbum(journalAlbum)}
                    >
                      <Text style={styles.journalDeleteText}>
                        Eliminar del diario
                      </Text>
                    </TouchableOpacity>
                  </View>

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
            </View>
          </KeyboardAvoidingView>
        </View>
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
  deleteAction: {
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginBottom: 12,
  },
  deleteActionText: {
    fontSize: 24,
    color: '#FFFFFF',
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
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0A0A0A',
  },
  pendingTag: {
    fontSize: 16,
    color: '#FFA726',
    marginLeft: 8,
  },
  quickListenButton: {
    backgroundColor: '#1A3A1A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: -6,
    marginBottom: 12,
    marginLeft: 72,
    alignSelf: 'flex-start',
  },
  quickListenText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  noResults: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  searchStatus: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultListenButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    alignItems: 'center',
  },
  resultListenText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  resultPendingButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFA726',
    alignItems: 'center',
  },
  resultPendingText: {
    color: '#FFA726',
    fontSize: 12,
    fontWeight: '600',
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
  journalHeaderRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: -12,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  journalDeleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  journalDeleteText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
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
