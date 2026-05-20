import { useState } from 'react';
import {
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { YStack, XStack, Input, Button, SizableText } from 'tamagui';
import { supabase } from '../lib/supabase';
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
      <YStack
        flex={1}
        backgroundColor="rgba(0,0,0,0.6)"
        justifyContent="center"
        alignItems="center"
        onPress={onClose}
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
          >
            <SizableText fontSize={20} fontWeight="bold" color="$color" marginBottom={20} textAlign="center">
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </SizableText>

            <Input
              backgroundColor="$brandGray"
              borderRadius={10}
              paddingHorizontal={16}
              paddingVertical={12}
              marginBottom={12}
              borderWidth={errorText ? 1 : 0}
              borderColor={errorText ? '$brandRed' : 'transparent'}
              placeholder="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrorText(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              backgroundColor="$brandGray"
              borderRadius={10}
              paddingHorizontal={16}
              paddingVertical={12}
              marginBottom={12}
              borderWidth={errorText ? 1 : 0}
              borderColor={errorText ? '$brandRed' : 'transparent'}
              placeholder="Contraseña"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrorText(''); }}
              secureTextEntry
            />

            {isPasswordWeak && (
              <SizableText color="$colorHover" fontSize={13} marginBottom={8}>
                La contraseña debe tener al menos 6 caracteres.
              </SizableText>
            )}

            {errorText ? (
              <SizableText color="$brandRed" fontSize={13} marginBottom={12} textAlign="center">
                {errorText}
              </SizableText>
            ) : null}

            {isSignUp && (
              <SizableText color="$colorHover" fontSize={12} marginBottom={12} textAlign="center">
                Te enviaremos un email para confirmar tu cuenta.
              </SizableText>
            )}

            <Button
              backgroundColor="$brandGold"
              paddingVertical={14}
              borderRadius={10}
              marginTop={4}
              opacity={isPasswordWeak ? 0.5 : 1}
              disabled={submitting || !!isPasswordWeak}
              pressStyle={{ opacity: 0.8, scale: 0.97 }}
              onPress={handleSubmit}
            >
              <SizableText color="#0A0A0A" fontSize={16} fontWeight="bold">
                {submitting ? 'Enviando...' : isSignUp ? 'Registrarse' : 'Entrar'}
              </SizableText>
            </Button>

            <Button
              backgroundColor="transparent"
              marginTop={16}
              paddingVertical={8}
              pressStyle={{ opacity: 0.8, scale: 0.97 }}
              onPress={() => { setIsSignUp(!isSignUp); setErrorText(''); }}
            >
              <SizableText color="$brandGold" fontSize={14}>
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
              </SizableText>
            </Button>

            {migrateProgress ? (
              <SizableText color="$colorHover" fontSize={12} marginBottom={4} textAlign="center">
                {migrateProgress}
              </SizableText>
            ) : null}

            <XStack justifyContent="center" gap={12} marginTop={12}>
              <Button
                paddingVertical={10}
                paddingHorizontal={16}
                borderRadius={8}
                borderWidth={1}
                borderColor="$brandRed"
                backgroundColor="transparent"
                pressStyle={{ opacity: 0.8, scale: 0.97 }}
                onPress={handleLogout}
              >
                <SizableText color="$brandRed" fontSize={13} fontWeight="600">Cerrar Sesión</SizableText>
              </Button>
              <Button
                paddingVertical={10}
                paddingHorizontal={16}
                borderRadius={8}
                borderWidth={1}
                borderColor="$brandGray"
                backgroundColor="$brandGray"
                pressStyle={{ opacity: 0.8, scale: 0.97 }}
                onPress={handleMigrate}
                disabled={migrating}
              >
                <SizableText color="$brandGold" fontSize={13} fontWeight="600">
                  {migrating ? 'Migrando...' : 'Migrar'}
                </SizableText>
              </Button>
            </XStack>
          </YStack>
        </KeyboardAvoidingView>
      </YStack>
    </Modal>
  );
}
