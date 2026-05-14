import { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { migrateJsonToSupabase } from '../utils/migration';

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
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setMenuVisible(true)}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
        )}
      </TouchableOpacity>

      {menuVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menu}>
            <Text style={styles.email} numberOfLines={1}>
              {email}
            </Text>
            <TouchableOpacity style={styles.menuButton} onPress={handleLogout}>
              <Text style={styles.menuIcon}>⏻</Text>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
            {migrateProgress ? (
              <Text style={styles.migrateText}>{migrateProgress}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleMigrate}
              disabled={migrating}
            >
              <Text style={styles.migrateIcon}>☁</Text>
              <Text style={styles.migrateButtonText}>
                {migrating ? 'Migrando...' : 'Migrar álbumes a Supabase'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  avatarButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  menu: {
    position: 'absolute',
    top: AVATAR_SIZE + 8,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  email: {
    color: colors.textSecondary,
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  menuIcon: {
    fontSize: 14,
    color: '#E53935',
  },
  logoutText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '600',
  },
  migrateIcon: {
    fontSize: 14,
    color: colors.primary,
  },
  migrateButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  migrateText: {
    color: colors.textSecondary,
    fontSize: 11,
    paddingHorizontal: 12,
    paddingVertical: 4,
    textAlign: 'center',
  },
});
