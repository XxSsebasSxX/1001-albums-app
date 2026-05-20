import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Input, Button, SizableText } from 'tamagui';
import { supabase } from '../lib/supabase';
import { handleSupabaseError } from '../utils/authErrors';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

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
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
    >
      <YStack width="100%" maxWidth={400} backgroundColor="$brandSurface" borderRadius={16} padding={32} borderWidth={1} borderColor="$brandGray">
        <SizableText fontSize={28} fontWeight="bold" color="$color" textAlign="center">
          1001 Albums
        </SizableText>
        <SizableText fontSize={14} color="$colorHover" textAlign="center" marginBottom={32} marginTop={4}>
          Diario Musical
        </SizableText>

        <SizableText fontSize={18} fontWeight="600" color="$color" marginBottom={20} textAlign="center">
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
      </YStack>
    </KeyboardAvoidingView>
  );
}
