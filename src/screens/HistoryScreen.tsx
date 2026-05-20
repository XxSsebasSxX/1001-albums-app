import { useState, useRef, useEffect } from 'react';
import {
  View,
  Dimensions,
  FlatList,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  LayoutAnimation,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Card, XStack, YStack, Input, Sheet, Button, SizableText } from 'tamagui';
import { Album, ListenedAlbum, RootStackParamList } from '../types';
import { useAlbums } from '../hooks/useAlbums';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
    <XStack gap={8} justifyContent="center">
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <SizableText fontSize={32} color={n <= value ? '$brandGold' : '$colorHover'}>
            {n <= value ? '★' : '☆'}
          </SizableText>
        </TouchableOpacity>
      ))}
    </XStack>
  );
}

const GRID_GAP = 10;
const GRID_PADDING = 12;
const CARD_PADDING = 6;

const screenWidth = Dimensions.get('window').width;
const gridCols = screenWidth > 600 ? 4 : 3;
const coverSize = Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP * (gridCols - 1)) / gridCols - CARD_PADDING * 2);

function AlbumCard({
  item,
  onPress,
  onDelete,
}: {
  item: ListenedAlbum;
  onPress: () => void;
  onDelete: () => void;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <Button
      backgroundColor="$brandRed"
      justifyContent="center"
      alignItems="center"
      width={60}
      borderRadius={10}
      pressStyle={{ opacity: 0.8, scale: 0.97 }}
      onPress={() => {
        swipeRef.current?.close();
        onDelete();
      }}
    >
      <SizableText fontSize={18} color="#FFFFFF">🗑️</SizableText>
    </Button>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions}>
      <Card
        backgroundColor="$brandSurface"
        borderRadius={10}
        borderWidth={1}
        borderColor="$brandGray"
        padding={CARD_PADDING}
        onPress={onPress}
      >
        <YStack gap="$2">
          <YStack position="relative">
            <AlbumCover artist={item.artist} album={item.album} size={coverSize} />
            {item.status === 'pending' && (
              <YStack
                position="absolute"
                top={2}
                right={2}
                backgroundColor="rgba(0,0,0,0.65)"
                borderRadius={3}
                paddingHorizontal={3}
                paddingVertical={1}
              >
                <SizableText fontSize={9} color="$brandOrange">⏳</SizableText>
              </YStack>
            )}
          </YStack>
          <SizableText size="$3" fontWeight="bold" color="$color" numberOfLines={1}>
            {item.album}
          </SizableText>
          <SizableText size="$1" color="$colorHover" numberOfLines={1}>
            {item.artist}
            {'  •  '}
            {item.year || '?'}
            {item.status === 'listened' && item.rating > 0 && `  •  ★ ${item.rating}`}
          </SizableText>
        </YStack>
      </Card>
    </Swipeable>
  );
}

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavProp>();
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
    <YStack flex={1} backgroundColor="$brandBg">
      <XStack
        paddingHorizontal={16}
        paddingTop={16}
        paddingBottom={8}
        justifyContent="space-between"
        alignItems="center"
      >
        <YStack>
          <SizableText fontSize={28} fontWeight="bold" color="$color">
            Mi Diario
          </SizableText>
          <SizableText fontSize={14} color="$colorHover" marginTop={2}>
            {listenedAlbums.length + pendingAlbums.length} discos
          </SizableText>
        </YStack>
        <XStack gap={8}>
          <Button
            paddingVertical={8}
            paddingHorizontal={10}
            borderRadius={8}
            borderWidth={1}
            borderColor="$colorHover"
            pressStyle={{ opacity: 0.8, scale: 0.97 }}
            onPress={() => navigation.navigate('Statistics')}
          >
            <SizableText fontSize={16}>📊</SizableText>
          </Button>
          <Button
            backgroundColor="$brandGold"
            paddingVertical={8}
            paddingHorizontal={14}
            borderRadius={8}
            pressStyle={{ opacity: 0.8, scale: 0.97 }}
            onPress={() => setIsAddVisible(true)}
          >
            <SizableText color="#0A0A0A" fontSize={13} fontWeight="bold">+ Añadir</SizableText>
          </Button>
        </XStack>
      </XStack>

      <XStack paddingHorizontal={16} marginBottom={12} gap={8}>
        <Button
          flex={1}
          paddingVertical={10}
          borderRadius={10}
          backgroundColor={activeTab === 'listened' ? '$brandGold' : '$brandGray'}
          pressStyle={{ opacity: 0.8, scale: 0.97 }}
          onPress={() => setActiveTab('listened')}
        >
          <SizableText
            color={activeTab === 'listened' ? '#0A0A0A' : '$colorHover'}
            fontSize={13}
            fontWeight="600"
          >
            Escuchados ({listenedAlbums.length})
          </SizableText>
        </Button>
        <Button
          flex={1}
          paddingVertical={10}
          borderRadius={10}
          backgroundColor={activeTab === 'pending' ? '$brandGold' : '$brandGray'}
          pressStyle={{ opacity: 0.8, scale: 0.97 }}
          onPress={() => setActiveTab('pending')}
        >
          <SizableText
            color={activeTab === 'pending' ? '#0A0A0A' : '$colorHover'}
            fontSize={13}
            fontWeight="600"
          >
            Pendientes ({pendingAlbums.length})
          </SizableText>
        </Button>
      </XStack>

      {currentList.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal={24}>
          <SizableText fontSize={18} color="$color" marginBottom={8}>
            {activeTab === 'listened' ? 'Aún no has escuchado nada' : 'No tienes discos pendientes'}
          </SizableText>
          <SizableText fontSize={14} color="$colorHover" textAlign="center">
            {activeTab === 'listened'
              ? 'Vuelve a inicio y descubre tu primer disco'
              : 'Marca discos como pendientes desde el buscador'}
          </SizableText>
        </YStack>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          numColumns={gridCols}
          columnWrapperStyle={{ gap: GRID_GAP, justifyContent: 'flex-start' }}
          ListHeaderComponent={
            <Card backgroundColor="$brandSurface" borderRadius={12} padding="$4" borderWidth={1} borderColor="$brandGray" marginBottom="$4">
              <YStack gap="$2">
                <SizableText size="$6" fontWeight="bold" color="$color">
                  Tu Viaje Musical
                </SizableText>
                {activeTab === 'listened' ? (
                  <SizableText size="$3" color="$colorHover">
                    Has completado{' '}
                    <SizableText size="$3" fontWeight="bold" color="$brandGold">{listenedAlbums.length}</SizableText>
                    {' '}de 1001 álbumes. 
                    {listenedAlbums.length > 0
                      ? '¡Buen ritmo!'
                      : '¡Empieza tu aventura!'}
                  </SizableText>
                ) : (
                  <SizableText size="$3" color="$colorHover">
                    Tienes{' '}
                    <SizableText size="$3" fontWeight="bold" color="$brandOrange">{pendingAlbums.length}</SizableText>
                    {' '}discos esperándote en tu lista de pendientes.
                  </SizableText>
                )}
                {listenedAlbums.length > 0 && (
                  <YStack gap="$1">
                    <XStack height={8} width="100%" borderRadius={4} backgroundColor="$brandGray" overflow="hidden">
                      <View
                        style={{
                          height: '100%',
                          width: `${Math.min((listenedAlbums.length / 1001) * 100, 100)}%`,
                          backgroundColor: '#F5A623',
                          borderRadius: 4,
                        }}
                      />
                    </XStack>
                    <SizableText size="$1" color="$colorHover" textAlign="right">
                      {Math.round((listenedAlbums.length / 1001) * 100)}% completado
                    </SizableText>
                  </YStack>
                )}
              </YStack>
            </Card>
          }
          ItemSeparatorComponent={() => <XStack height={GRID_GAP} />}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <AlbumCard
              item={item}
              onPress={() => openJournal(item)}
              onDelete={() => confirmDeleteAlbum(item)}
            />
          )}
          ListFooterComponent={
            <SizableText fontSize={11} color="$colorHover" textAlign="center" paddingVertical={20} paddingHorizontal={24} lineHeight={16}>
              Como afiliado de Amazon, esta aplicación percibe ingresos por las
              compras adscritas que cumplen los requisitos aplicables.
            </SizableText>
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
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={closeAdd}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <YStack
              width="85%"
              backgroundColor="$brandSurface"
              borderRadius={16}
              padding={24}
              borderWidth={1}
              borderColor="$brandGray"
              maxHeight="80%"
            >
              {!isManualMode ? (
                <YStack>
                  <SizableText fontSize={20} fontWeight="bold" color="$color" marginBottom={20} textAlign="center">
                    Buscar Álbum
                  </SizableText>

                  <XStack
                    backgroundColor="$brandGray"
                    borderRadius={10}
                    alignItems="center"
                    paddingLeft={12}
                    marginBottom={12}
                  >
                    <SizableText fontSize={16} color="$colorHover">🔍</SizableText>
                    <Input
                      placeholder="Escribe el nombre del álbum o artista..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                      backgroundColor="transparent"
                      borderWidth={0}
                      borderRadius={10}
                      size="$4"
                      flex={1}
                    />
                  </XStack>

                  {searchLoading && (
                    <SizableText color="$colorHover" fontSize={13} textAlign="center" marginTop={16}>
                      Buscando...
                    </SizableText>
                  )}

                  {!searchLoading && searchResults.length > 0 && (
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <YStack>
                          <XStack alignItems="center" paddingVertical={10} paddingHorizontal={4} borderBottomWidth={1} borderBottomColor="$brandGray">
                            <AlbumCover artist={item.artist} album={item.album} size={50} />
                            <YStack flex={1} marginLeft={12}>
                              <SizableText fontSize={15} fontWeight="600" color="$color" marginBottom={2}>
                                {item.album}
                              </SizableText>
                              <SizableText fontSize={13} color="$brandGold">
                                {item.artist}
                              </SizableText>
                            </YStack>
                          </XStack>
                          <XStack gap={8} paddingHorizontal={4} paddingBottom={10} borderBottomWidth={1} borderBottomColor="$brandGray">
                            <Button
                              flex={1}
                              paddingVertical={6}
                              borderRadius={6}
                              borderWidth={1}
                              borderColor="$brandGreen"
                              backgroundColor="transparent"
                              pressStyle={{ opacity: 0.8, scale: 0.97 }}
                              onPress={() => handleMarkAsListened(item)}
                            >
                              <SizableText color="$brandGreen" fontSize={12} fontWeight="600">✓ Escuchado</SizableText>
                            </Button>
                            <Button
                              flex={1}
                              paddingVertical={6}
                              borderRadius={6}
                              borderWidth={1}
                              borderColor="$brandOrange"
                              backgroundColor="transparent"
                              pressStyle={{ opacity: 0.8, scale: 0.97 }}
                              onPress={() => handleAddToPending(item)}
                            >
                              <SizableText color="$brandOrange" fontSize={12} fontWeight="600">⏳ Pendiente</SizableText>
                            </Button>
                          </XStack>
                        </YStack>
                      )}
                      style={{ maxHeight: 280, marginTop: 4 }}
                      keyboardShouldPersistTaps="handled"
                    />
                  )}

                  {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
                    <SizableText color="$colorHover" fontSize={14} textAlign="center" marginTop={16}>
                      No encontramos ese disco en la lista oficial.
                    </SizableText>
                  )}

                  <Button
                    backgroundColor="transparent"
                    marginTop={16}
                    paddingVertical={10}
                    pressStyle={{ opacity: 0.8, scale: 0.97 }}
                    onPress={() => setIsManualMode(true)}
                  >
                    <SizableText color="$brandGold" fontSize={14} fontWeight="600">
                      ¿No está en la lista? Añadir manualmente
                    </SizableText>
                  </Button>
                </YStack>
              ) : (
                <YStack>
                  <SizableText fontSize={20} fontWeight="bold" color="$color" marginBottom={20} textAlign="center">
                    Añadir Manualmente
                  </SizableText>

                  <Input
                    backgroundColor="$brandGray"
                    borderRadius={10}
                    paddingHorizontal={16}
                    paddingVertical={12}
                    marginBottom={12}
                    placeholder="Título del álbum"
                    value={title}
                    onChangeText={setTitle}
                  />
                  <Input
                    backgroundColor="$brandGray"
                    borderRadius={10}
                    paddingHorizontal={16}
                    paddingVertical={12}
                    marginBottom={12}
                    placeholder="Artista"
                    value={artist}
                    onChangeText={setArtist}
                  />
                  <Input
                    backgroundColor="$brandGray"
                    borderRadius={10}
                    paddingHorizontal={16}
                    paddingVertical={12}
                    marginBottom={12}
                    placeholder="Año (opcional)"
                    value={year}
                    onChangeText={setYear}
                    keyboardType="number-pad"
                  />
                  <Input
                    backgroundColor="$brandGray"
                    borderRadius={10}
                    paddingHorizontal={16}
                    paddingVertical={12}
                    marginBottom={12}
                    placeholder="Género (opcional)"
                    value={genre}
                    onChangeText={setGenre}
                  />

                  <Button
                    backgroundColor="$brandGold"
                    paddingVertical={14}
                    borderRadius={10}
                    marginTop={4}
                    pressStyle={{ opacity: 0.8, scale: 0.97 }}
                    onPress={handleSaveCustom}
                  >
                    <SizableText color="#0A0A0A" fontSize={16} fontWeight="bold">Guardar</SizableText>
                  </Button>

                  <Button
                    backgroundColor="transparent"
                    marginTop={12}
                    paddingVertical={10}
                    pressStyle={{ opacity: 0.8, scale: 0.97 }}
                    onPress={() => setIsManualMode(false)}
                  >
                    <SizableText color="$colorHover" fontSize={14}>Volver al buscador</SizableText>
                  </Button>
                </YStack>
              )}
            </YStack>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      <Sheet
        modal
        open={!!journalAlbum}
        onOpenChange={(open: boolean) => { if (!open) closeJournal(); }}
        snapPoints={[85]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame backgroundColor="$brandSurface" padding={24} paddingBottom={40}>
          <Sheet.Handle backgroundColor="#555" />
          {journalAlbum && (
            <YStack alignItems="center" gap={16}>
              <XStack width="100%" justifyContent="flex-end">
                <Button
                  backgroundColor="transparent"
                  pressStyle={{ opacity: 0.8, scale: 0.97 }}
                  onPress={() => confirmDeleteAlbum(journalAlbum)}
                >
                  <SizableText color="$brandRed" fontSize={13} fontWeight="600">Eliminar del diario</SizableText>
                </Button>
              </XStack>

              <AlbumCover
                artist={journalAlbum.artist}
                album={journalAlbum.album}
                size={180}
              />

              <YStack alignItems="center" gap={4}>
                <SizableText fontSize={20} fontWeight="bold" color="$color" textAlign="center" marginTop={16}>
                  {journalAlbum.album}
                </SizableText>
                <SizableText fontSize={16} color="$brandGold" marginTop={4} marginBottom={16}>
                  {journalAlbum.artist}
                </SizableText>
              </YStack>

              <YStack width="100%" gap={6}>
                <SizableText fontSize={14} color="$colorHover" fontWeight="600">Tu puntuación</SizableText>
                <StarSelector value={journalRating} onChange={setJournalRating} />
              </YStack>

              <YStack width="100%" gap={6}>
                <SizableText fontSize={14} color="$colorHover" fontWeight="600">Tus notas</SizableText>
                <Input
                  multiline
                  backgroundColor="$brandGray"
                  borderWidth={0}
                  borderRadius={10}
                  placeholder="Escribe tu reseña personal..."
                  value={journalNotes}
                  onChangeText={setJournalNotes}
                  minHeight={100}
                  textAlignVertical="top"
                  padding={12}
                />
              </YStack>

              <XStack gap={12} width="100%">
                <Button
                  flex={1}
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="#1A1A1A"
                  borderRadius={10}
                  borderWidth={1}
                  borderColor="$brandGray"
                  gap={6}
                  pressStyle={{ opacity: 0.8, scale: 0.97 }}
                  onPress={() =>
                    Linking.openURL(getAffiliateLink(journalAlbum.artist, journalAlbum.album, 'amazon'))
                  }
                >
                  <SizableText fontSize={16}>🛒</SizableText>
                  <SizableText color="$color" fontSize={12} fontWeight="600">Comprar Vinilo</SizableText>
                </Button>
                <Button
                  flex={1}
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="#1A1A1A"
                  borderRadius={10}
                  borderWidth={1}
                  borderColor="$brandGray"
                  gap={6}
                  pressStyle={{ opacity: 0.8, scale: 0.97 }}
                  onPress={() =>
                    Linking.openURL(getAffiliateLink(journalAlbum.artist, journalAlbum.album, 'apple'))
                  }
                >
                  <SizableText fontSize={16}>🎵</SizableText>
                  <SizableText color="$color" fontSize={12} fontWeight="600">Escuchar en Apple</SizableText>
                </Button>
              </XStack>

              <Button
                backgroundColor="$brandGold"
                paddingVertical={14}
                borderRadius={10}
                width="100%"
                pressStyle={{ opacity: 0.8, scale: 0.97 }}
                onPress={saveJournal}
              >
                <SizableText color="#0A0A0A" fontSize={16} fontWeight="bold">Guardar Notas</SizableText>
              </Button>
            </YStack>
          )}
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
