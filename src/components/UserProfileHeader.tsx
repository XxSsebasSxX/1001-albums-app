import { useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { YStack, XStack, Card, Button, SizableText } from 'tamagui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { migrateJsonToSupabase } from '../utils/migration';
import { Alert } from 'react-native';

const AVATAR_SIZE = 36;

export default function UserProfileHeader() {
  const { session } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateProgress, setMigrateProgress] = useState('');

  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const email = user?.email ?? '';
  const initial = email.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setMenuVisible(false);
    await supabase.auth.signOut();
  };

  const handleMigrate = async () => {
    if (migrating) return;
    setMigrating(true);
    setMigrateProgress('Iniciando...');
    const result = await migrateJsonToSupabase((done, total) => {
      setMigrateProgress(`Migrando ${done}/${total}...`);
    });
    setMigrateProgress(`Hecho: ${result.inserted} insertados, ${result.errors} errores`);
    setMigrating(false);
    if (result.errors > 0) {
      Alert.alert('Migración completada', `${result.inserted} insertados, ${result.errors} errores`);
    }
  };

  return (
    <YStack position="relative" zIndex={10}>
      <Button
        width={AVATAR_SIZE}
        height={AVATAR_SIZE}
        borderRadius={AVATAR_SIZE / 2}
        padding={0}
        backgroundColor="transparent"
        overflow="hidden"
        pressStyle={{ opacity: 0.8, scale: 0.95 }}
        onPress={() => setMenuVisible(true)}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }} />
        ) : (
          <YStack width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} backgroundColor="#3A3A3A" justifyContent="center" alignItems="center">
            <SizableText color="$color" fontSize={16} fontWeight="bold">{initial}</SizableText>
          </YStack>
        )}
      </Button>

      {menuVisible && (
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <Card
            position="absolute"
            top={AVATAR_SIZE + 8}
            right={0}
            backgroundColor="$brandSurface"
            borderRadius={12}
            padding={8}
            minWidth={180}
            borderWidth={1}
            borderColor="$brandGray"
            elevation={12}
            zIndex={101}
          >
            <SizableText color="$colorHover" fontSize={12} paddingHorizontal={12} paddingVertical={8} numberOfLines={1}>
              {email}
            </SizableText>
            <Button
              backgroundColor="transparent"
              flexDirection="row"
              alignItems="center"
              paddingVertical={10}
              paddingHorizontal={12}
              borderRadius={8}
              gap={8}
              pressStyle={{ opacity: 0.8, scale: 0.97 }}
              onPress={handleLogout}
            >
              <SizableText fontSize={14} color="$brandRed">⏻</SizableText>
              <SizableText color="$brandRed" fontSize={14} fontWeight="600">Cerrar Sesión</SizableText>
            </Button>
            {migrateProgress ? (
              <SizableText color="$colorHover" fontSize={11} paddingHorizontal={12} paddingVertical={4} textAlign="center">
                {migrateProgress}
              </SizableText>
            ) : null}
            <Button
              backgroundColor="transparent"
              flexDirection="row"
              alignItems="center"
              paddingVertical={10}
              paddingHorizontal={12}
              borderRadius={8}
              gap={8}
              pressStyle={{ opacity: 0.8, scale: 0.97 }}
              onPress={handleMigrate}
              disabled={migrating}
            >
              <SizableText fontSize={14} color="$brandGold">☁</SizableText>
              <SizableText color="$brandGold" fontSize={14} fontWeight="600">
                {migrating ? 'Migrando...' : 'Migrar álbumes a Supabase'}
              </SizableText>
            </Button>
          </Card>
        </TouchableOpacity>
      )}
    </YStack>
  );
}
