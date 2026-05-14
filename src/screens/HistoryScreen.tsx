import { useState } from 'react';
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

function AlbumCard({ item }: { item: Album }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardAlbum}>{item.album}</Text>
      <Text style={styles.cardArtist}>{item.artist}</Text>
      <View style={styles.cardMetaRow}>
        <Text style={styles.cardMeta}>{item.year || '?'}</Text>
        <Text style={styles.cardMeta}>{item.genre}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { listened, addCustomAlbum } = useAlbums();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');

  const resetForm = () => {
    setTitle('');
    setArtist('');
    setYear('');
    setGenre('');
  };

  const handleSave = () => {
    if (!title.trim() || !artist.trim()) return;
    addCustomAlbum({
      album: title.trim(),
      artist: artist.trim(),
      year: year ? parseInt(year, 10) : 0,
      genre: genre.trim() || 'Various',
    });
    resetForm();
    setIsModalVisible(false);
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
          <Text style={styles.addButtonText}>+ Añadir Manual</Text>
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
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
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
              <Text style={styles.formTitle}>Añadir Álbum</Text>

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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginBottom: 8,
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
});
