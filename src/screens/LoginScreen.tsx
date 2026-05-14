import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { handleSupabaseError } from '../utils/authErrors';
import { migrateJsonToSupabase } from '../utils/migration';

interface LoginScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoginScreen({ visible, onClose }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrateProgress, setMigrateProgress] = useState('');
  const [migrateDone, setMigrateDone] = useState(false);

  const isPasswordWeak = isSignUp && password.length > 0 && password.length < 6;

  const handleSubmit = async () => {
    setErrorText('');

    if (!email.trim() || !password.trim()) {
      setErrorText('Completa email y contraseña.');
      return;
    }

    if (isSignUp && password.length < 6) {
      setErrorText('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    const action = isSignUp
      ? supabase.auth.signUp({ email: email.trim(), password })
      : supabase.auth.signInWithPassword({ email: email.trim(), password });
    const { error } = await action;
    setSubmitting(false);

    if (error) {
      setErrorText(handleSupabaseError(error));
      return;
    }

    if (isSignUp) {
      setErrorText('');
      onClose();
      return;
    }

    onClose();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
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
    setMigrateDone(true);
    if (result.errors > 0) {
      Alert.alert('Migración completada', `${result.inserted} insertados, ${result.errors} errores`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.card}>
            <Text style={styles.title}>
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </Text>

            <TextInput
              style={[styles.input, errorText ? styles.inputError : null]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={(v) => { setEmail(v); setErrorText(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={[styles.input, errorText ? styles.inputError : null]}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrorText(''); }}
              secureTextEntry
            />

            {isPasswordWeak && (
              <Text style={styles.hint}>
                La contraseña debe tener al menos 6 caracteres.
              </Text>
            )}

            {errorText ? (
              <Text style={styles.error}>{errorText}</Text>
            ) : null}

            {isSignUp && (
              <Text style={styles.successHint}>
                Te enviaremos un email para confirmar tu cuenta.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                isPasswordWeak && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting || !!isPasswordWeak}
            >
              <Text style={styles.submitText}>
                {submitting
                  ? 'Enviando...'
                  : isSignUp
                    ? 'Registrarse'
                    : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => { setIsSignUp(!isSignUp); setErrorText(''); }}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? '¿Ya tienes cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate'}
              </Text>
            </TouchableOpacity>

            {migrateProgress ? (
              <Text style={styles.migrateText}>{migrateProgress}</Text>
            ) : null}

            <View style={styles.adminRow}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.migrateButton}
                onPress={handleMigrate}
                disabled={migrating}
              >
                <Text style={styles.migrateButtonText}>
                  {migrating ? 'Migrando...' : 'Migrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  card: {
    width: '85%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
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
  inputError: {
    borderWidth: 1,
    borderColor: '#E53935',
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  error: {
    color: '#E53935',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  successHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
  },
  adminRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  logoutText: {
    color: '#E53935',
    fontSize: 13,
    fontWeight: '600',
  },
  migrateButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#2A2A2A',
  },
  migrateButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  migrateText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
});
