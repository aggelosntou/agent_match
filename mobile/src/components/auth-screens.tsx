import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';

import { useAuth, type RegisterData } from '@/context/auth';

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg: '#0D0D0F',
  surface: '#18181B',
  surfaceHigh: '#222226',
  border: '#2C2C30',
  accent: '#FF6B00',
  accentDim: '#FF6B0022',
  text: '#FFFFFF',
  textSub: '#8A8A8E',
  textMuted: '#505055',
  error: '#FF453A',
  errorDim: '#FF453A18',
  success: '#30D158',
};

// ── Constants ──────────────────────────────────────────────────────────────
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const AVAILABILITY_OPTIONS = ['tonight', 'tomorrow', 'weekends'] as const;
const COMMON_INTERESTS = [
  { label: '🏀 basketball', value: 'basketball' },
  { label: '⚽ football', value: 'football' },
  { label: '🎾 tennis', value: 'tennis' },
  { label: '🍹 drinks', value: 'drinks' },
  { label: '☕ coffee', value: 'coffee' },
  { label: '🥾 hiking', value: 'hiking' },
  { label: '🚴 cycling', value: 'cycling' },
  { label: '🏐 volleyball', value: 'volleyball' },
] as const;

// ── Shared sub-components ──────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      style={[s.input, focused && s.inputFocused, props.style]}
      placeholderTextColor={C.textMuted}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

// ── Login ──────────────────────────────────────────────────────────────────

export function LoginScreen({ onGoRegister }: { onGoRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={s.loginContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkText}>AM</Text>
          </View>
          <Text style={s.heroTitle}>Agent Match</Text>
          <Text style={s.heroSubtitle}>Find people to do things with.</Text>
        </View>

        {/* Form card */}
        <View style={s.card}>
          {error && (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerText}>{error}</Text>
            </View>
          )}

          <Field label="Email">
            <StyledInput
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </Field>

          <Field label="Password">
            <StyledInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />
          </Field>

          <Pressable
            style={({ pressed }) => [s.primaryBtn, pressed && s.primaryBtnPressed, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.primaryBtnText}>Log in</Text>}
          </Pressable>
        </View>

        <Pressable onPress={onGoRegister} style={s.switchRow}>
          <Text style={s.switchText}>
            Don't have an account?{'  '}
            <Text style={s.switchLink}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Register ───────────────────────────────────────────────────────────────

export function RegisterScreen({ onGoLogin }: { onGoLogin: () => void }) {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [skillLevel, setSkillLevel] = useState<string>('intermediate');
  const [interests, setInterests] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (item: string) =>
    setInterests(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );

  const toggleAvailability = (item: string) =>
    setAvailability(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );

  const handleRegister = async () => {
    if (!email.trim() || !password || !name.trim() || !location.trim()) {
      setError('All fields are required.');
      return;
    }
    if (interests.length === 0) {
      setError('Select at least one interest.');
      return;
    }
    if (availability.length === 0) {
      setError('Select at least one availability slot.');
      return;
    }

    const payload: RegisterData = {
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
      interests,
      location: location.trim(),
      skill_level: skillLevel,
      availability,
    };

    try {
      setLoading(true);
      setError(null);
      await register(payload);
    } catch (e: any) {
      setError(e.message ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={s.registerContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.registerHeader}>
          <Text style={s.heroTitle}>Create account</Text>
          <Text style={s.heroSubtitle}>Set up your profile to find matches.</Text>
        </View>

        <View style={s.card}>
          {error && (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerText}>{error}</Text>
            </View>
          )}

          <Field label="Name">
            <StyledInput placeholder="Your name" value={name} onChangeText={setName} />
          </Field>

          <Field label="Email">
            <StyledInput
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Field>

          <Field label="Password">
            <StyledInput
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Field>

          <Field label="City / neighbourhood">
            <StyledInput
              placeholder="e.g. Athens, Barcelona, Budapest…"
              value={location}
              onChangeText={setLocation}
            />
          </Field>
        </View>

        {/* Skill level */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Skill level</Text>
          <View style={s.chipRow}>
            {SKILL_LEVELS.map(level => (
              <Pressable
                key={level}
                style={[s.chip, skillLevel === level && s.chipActive]}
                onPress={() => setSkillLevel(level)}
              >
                <Text style={[s.chipText, skillLevel === level && s.chipTextActive]}>
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Interests */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Interests</Text>
          <View style={s.chipRow}>
            {COMMON_INTERESTS.map(item => (
              <Pressable
                key={item.value}
                style={[s.chip, interests.includes(item.value) && s.chipActive]}
                onPress={() => toggleInterest(item.value)}
              >
                <Text style={[s.chipText, interests.includes(item.value) && s.chipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Availability */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>When are you free?</Text>
          <View style={s.chipRow}>
            {AVAILABILITY_OPTIONS.map(item => (
              <Pressable
                key={item}
                style={[s.chip, availability.includes(item) && s.chipActive]}
                onPress={() => toggleAvailability(item)}
              >
                <Text style={[s.chipText, availability.includes(item) && s.chipTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [s.primaryBtn, s.primaryBtnWide, pressed && s.primaryBtnPressed, loading && s.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.primaryBtnText}>Create account</Text>}
        </Pressable>

        <Pressable onPress={onGoLogin} style={s.switchRow}>
          <Text style={s.switchText}>
            Already have an account?{'  '}
            <Text style={s.switchLink}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },

  // Login layout
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // Register layout
  registerContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 48,
  },
  registerHeader: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoMarkText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: C.textSub,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },

  // Field
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: C.text,
  },
  inputFocused: {
    borderColor: C.accent,
  },

  // Sections (outside card)
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  chipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  chipText: {
    fontSize: 14,
    color: C.textSub,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // Button
  primaryBtn: {
    backgroundColor: C.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnWide: {
    marginHorizontal: 0,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Error
  errorBanner: {
    backgroundColor: C.errorDim,
    borderWidth: 1,
    borderColor: C.error,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: C.error,
    fontSize: 14,
    fontWeight: '500',
  },

  // Footer link
  switchRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: C.textSub,
    fontSize: 14,
  },
  switchLink: {
    color: C.accent,
    fontWeight: '700',
  },
});
