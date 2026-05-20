import { useState } from 'react';
import {
  SafeAreaView,
  Linking,
} from 'react-native';
import { YStack, XStack, Button, SizableText } from 'tamagui';
import { View as MotiView } from 'moti';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Album } from '../types';
import { useAlbums } from '../hooks/useAlbums';
import albumsData from '../data/albums.json';
import AlbumCover from '../components/AlbumCover';
import UserProfileHeader from '../components/UserProfileHeader';
import { getAffiliateLink } from '../utils/affiliate';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { listened, markAsListened, addToPending } = useAlbums();
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);

  const pickRandom = () => {
    const addedIds = new Set(listened.map((a) => a.id));
    const available = albumsData.filter((a) => !addedIds.has(a.id));
    if (available.length === 0) return;
    const randomIndex = Math.floor(Math.random() * available.length);
    setCurrentAlbum(available[randomIndex]);
  };

  const entry = currentAlbum
    ? listened.find((a) => a.id === currentAlbum.id)
    : undefined;
  const isListened = entry?.status === 'listened';
  const isPending = entry?.status === 'pending';

  return (
    <YStack flex={1} backgroundColor="$brandBg">
      <XStack alignItems="flex-end" paddingHorizontal={16} paddingTop={8}>
        <UserProfileHeader />
      </XStack>
      <MotiView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <SizableText fontSize={32} fontWeight="bold" color="$color" marginBottom={4}>
          1001 Albums
        </SizableText>
        <SizableText fontSize={14} color="$colorHover" marginBottom={40}>
          Descubre tu próxima obra maestra
        </SizableText>

        <Button
          backgroundColor="$brandGold"
          paddingVertical={16}
          paddingHorizontal={32}
          borderRadius={12}
          marginBottom={32}
          pressStyle={{ opacity: 0.8, scale: 0.97 }}
          onPress={pickRandom}
        >
          <SizableText color="#0A0A0A" fontSize={16} fontWeight="bold">Generar Disco Aleatorio</SizableText>
        </Button>

        {currentAlbum && (
          <YStack
            minHeight={150}
            width="90%"
            padding={24}
            borderRadius={16}
            backgroundColor="$brandSurface"
            alignItems="center"
            borderWidth={1}
            borderColor="$colorHover"
            marginBottom={24}
            elevation={8}
          >
            <MotiView
              key={currentAlbum.id}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 350 }}
            >
              <AlbumCover artist={currentAlbum.artist} album={currentAlbum.album} size={250} />
              <SizableText fontSize={20} fontWeight="bold" color="$color" textAlign="center" marginTop={16} marginBottom={8}>
                {currentAlbum.album}
              </SizableText>
              <SizableText fontSize={16} color="$brandGold" marginBottom={12}>
                {currentAlbum.artist}
              </SizableText>
              <XStack gap={16} marginBottom={16}>
                <SizableText fontSize={14} color="$colorHover">{currentAlbum.year}</SizableText>
                <SizableText fontSize={14} color="$colorHover">{currentAlbum.genre}</SizableText>
              </XStack>

              {isListened && (
                <SizableText color="$brandGreen" fontSize={14} fontWeight="600">✓ Escuchado</SizableText>
              )}

              {isPending && (
                <YStack alignItems="center" gap={8}>
                  <SizableText color="$brandOrange" fontSize={14} fontWeight="600">⏳ Pendiente</SizableText>
                  <Button
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderColor="$brandGold"
                    borderRadius={8}
                    paddingVertical={10}
                    paddingHorizontal={20}
                    pressStyle={{ opacity: 0.8, scale: 0.97 }}
                    onPress={() => markAsListened(currentAlbum.id)}
                  >
                    <SizableText color="$brandGold">Marcar como Escuchado</SizableText>
                  </Button>
                </YStack>
              )}

              {!isListened && !isPending && (
                <XStack gap={10}>
                  <Button
                    flex={1}
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderColor="$brandGreen"
                    borderRadius={8}
                    paddingVertical={10}
                    paddingHorizontal={20}
                    pressStyle={{ opacity: 0.8, scale: 0.97 }}
                    onPress={() => markAsListened(currentAlbum.id)}
                  >
                    <SizableText color="$brandGreen">✓ Escuchado</SizableText>
                  </Button>
                  <Button
                    flex={1}
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderColor="$brandOrange"
                    borderRadius={8}
                    paddingVertical={10}
                    paddingHorizontal={20}
                    pressStyle={{ opacity: 0.8, scale: 0.97 }}
                    onPress={() => addToPending(currentAlbum.id)}
                  >
                    <SizableText color="$brandOrange">⏳ Pendiente</SizableText>
                  </Button>
                </XStack>
              )}

              <XStack gap={12} marginTop={16} width="100%">
                <Button
                  flex={1}
                  backgroundColor="$brandGray"
                  borderRadius={10}
                  borderWidth={1}
                  borderColor="$colorHover"
                  gap={6}
                  pressStyle={{ opacity: 0.8, scale: 0.97 }}
                  onPress={() =>
                    Linking.openURL(getAffiliateLink(currentAlbum.artist, currentAlbum.album, 'amazon'))
                  }
                >
                  🛒 Comprar Vinilo
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$brandGray"
                  borderRadius={10}
                  borderWidth={1}
                  borderColor="$colorHover"
                  gap={6}
                  pressStyle={{ opacity: 0.8, scale: 0.97 }}
                  onPress={() =>
                    Linking.openURL(getAffiliateLink(currentAlbum.artist, currentAlbum.album, 'apple'))
                  }
                >
                  🎵 Escuchar en Apple
                </Button>
              </XStack>
            </MotiView>
          </YStack>
        )}

        <Button
          backgroundColor="transparent"
          paddingVertical={12}
          paddingHorizontal={24}
          pressStyle={{ opacity: 0.8, scale: 0.97 }}
          onPress={() => navigation.navigate('History')}
        >
          <SizableText color="$colorHover">Ver tu Colección</SizableText>
        </Button>
      </MotiView>
    </YStack>
  );
}
