import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg: '#0D0D0F',
  surface: '#18181B',
  surfaceHigh: '#222226',
  border: '#2C2C30',
  accent: '#FF6B00',
  text: '#FFFFFF',
  textSub: '#8A8A8E',
  textMuted: '#505055',
  success: '#30D158',
  successDim: '#30D15820',
  successBorder: '#30D15840',
  error: '#FF453A',
  errorDim: '#FF453A18',
};

// ── Types ──────────────────────────────────────────────────────────────────

type UserPublic = {
  id: string;
  name: string;
  interests: string[];
  location: string;
  skill_level: string;
  availability: string[];
};

type MatchResult = {
  user: UserPublic;
  score: number;
};

type ParsedPrompt = {
  activity: string | null;
  location: string | null;
  skill_level: string | null;
  availability: string | null;
  group_size: number | null;
};

// ── Avatar helper ──────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const bg = `hsl(${hue}, 55%, 38%)`;

  return (
    <View style={[avs.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[avs.text, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const avs = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});

// ── HomeScreen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { token, user, logout } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [parsedPrompt, setParsedPrompt] = useState<ParsedPrompt | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<UserPublic[]>([]);
  const [requestedPeople, setRequestedPeople] = useState<number | null>(null);
  const [foundPeople, setFoundPeople] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const sendConnect = async (toUserId: string, activity: string | null) => {
    try {
      const res = await fetch(`${API_BASE_URL}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to_user_id: toUserId, activity }),
      });
      if (res.ok || res.status === 409) {
        setSentRequests(prev => new Set(prev).add(toUserId));
      }
    } catch {
      // ignore
    }
  };

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      setHasSearched(true);
      setErrorMessage(null);
      setSelectedGroup([]);
      setMatches([]);
      setParsedPrompt(null);
      setRequestedPeople(null);
      setFoundPeople(null);

      const response = await fetch(`${API_BASE_URL}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Backend request failed');

      const data = await response.json();
      setSelectedGroup(data.selected_group);
      setMatches(data.matches);
      setParsedPrompt(data.parsed_prompt);
      setRequestedPeople(data.requested_people);
      setFoundPeople(data.found_people);
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.appName}>Agent Match</Text>
          {user && <Text style={s.greeting}>Hi, {user.name} 👋</Text>}
        </View>
        <Pressable onPress={logout} style={s.logoutBtn}>
          <Text style={s.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.user.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <View>
            {/* Search box */}
            <View style={s.searchCard}>
              <TextInput
                style={s.searchInput}
                placeholder="Find me 4 people to play basketball tonight in Athens…"
                placeholderTextColor={C.textMuted}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <Pressable
                style={({ pressed }) => [s.searchBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.5 }]}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.searchBtnText}>Find Matches</Text>}
              </Pressable>
            </View>

            {/* Error */}
            {errorMessage && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Parsed tags */}
            {parsedPrompt && (
              <View style={s.parsedRow}>
                {parsedPrompt.activity && <Tag label={parsedPrompt.activity} />}
                {parsedPrompt.location && <Tag label={parsedPrompt.location} icon="📍" />}
                {parsedPrompt.skill_level && <Tag label={parsedPrompt.skill_level} />}
                {parsedPrompt.availability && <Tag label={parsedPrompt.availability} icon="🕐" />}
                {parsedPrompt.group_size && <Tag label={`group of ${parsedPrompt.group_size}`} icon="👥" />}
              </View>
            )}

            {/* Suggested group */}
            {selectedGroup.length > 0 && (
              <View style={s.groupBox}>
                <View style={s.groupHeader}>
                  <Text style={s.groupTitle}>Suggested Group</Text>
                  {requestedPeople !== null && foundPeople !== null && foundPeople < requestedPeople && (
                    <Text style={s.groupCount}>{foundPeople}/{requestedPeople} found</Text>
                  )}
                </View>
                {selectedGroup.map(u => (
                  <GroupCard key={u.id} user={u} />
                ))}
              </View>
            )}

            {/* Empty state */}
            {hasSearched && !loading && !errorMessage && matches.length === 0 && (
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>🔍</Text>
                <Text style={s.emptyTitle}>No matches found</Text>
                <Text style={s.emptyText}>Try a different activity, location, or time.</Text>
              </View>
            )}

            {matches.length > 0 && (
              <Text style={s.sectionLabel}>All matches</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const already = sentRequests.has(item.user.id);
          return (
            <View style={s.matchCard}>
              <View style={s.matchCardTop}>
                <Avatar name={item.user.name} size={44} />
                <View style={s.matchInfo}>
                  <Text style={s.matchName}>{item.user.name}</Text>
                  <Text style={s.matchMeta}>{item.user.location} · {item.user.skill_level}</Text>
                </View>
                <View style={s.scoreBadge}>
                  <Text style={s.scoreText}>{item.score}</Text>
                </View>
              </View>

              <View style={s.matchTags}>
                {item.user.interests.slice(0, 4).map(i => (
                  <View key={i} style={s.miniTag}>
                    <Text style={s.miniTagText}>{i}</Text>
                  </View>
                ))}
              </View>

              <Text style={s.matchAvail}>{item.user.availability.join(' · ')}</Text>

              <Pressable
                style={({ pressed }) => [s.connectBtn, already && s.connectBtnSent, pressed && !already && { opacity: 0.8 }]}
                onPress={() => sendConnect(item.user.id, parsedPrompt?.activity ?? null)}
                disabled={already}
              >
                <Text style={[s.connectBtnText, already && s.connectBtnTextSent]}>
                  {already ? 'Request sent ✓' : 'Connect'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function Tag({ label, icon }: { label: string; icon?: string }) {
  return (
    <View style={s.tag}>
      {icon && <Text style={s.tagIcon}>{icon} </Text>}
      <Text style={s.tagText}>{label}</Text>
    </View>
  );
}

function GroupCard({ user }: { user: UserPublic }) {
  return (
    <View style={s.groupCard}>
      <Avatar name={user.name} size={36} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={s.groupCardName}>{user.name}</Text>
        <Text style={s.groupCardMeta}>{user.location} · {user.skill_level}</Text>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  appName: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  greeting: { fontSize: 13, color: C.textSub, marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  logoutText: { fontSize: 13, color: C.textSub, fontWeight: '500' },

  // Search
  searchCard: {
    margin: 16,
    backgroundColor: C.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  searchInput: {
    fontSize: 15,
    color: C.text,
    minHeight: 52,
    marginBottom: 12,
    lineHeight: 22,
  },
  searchBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Error
  errorBox: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.errorDim,
    borderWidth: 1,
    borderColor: C.error,
    marginBottom: 12,
  },
  errorText: { color: C.error, fontSize: 14, fontWeight: '500' },

  // Parsed tags row
  parsedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  tagIcon: { fontSize: 12 },
  tagText: { fontSize: 13, color: C.text, fontWeight: '500' },

  // Group box
  groupBox: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: C.successDim,
    borderWidth: 1,
    borderColor: C.successBorder,
    borderRadius: 16,
    padding: 14,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupTitle: { fontSize: 15, fontWeight: '700', color: C.success },
  groupCount: { fontSize: 13, color: C.textSub },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  groupCardName: { fontSize: 15, fontWeight: '600', color: C.text },
  groupCardMeta: { fontSize: 13, color: C.textSub, marginTop: 1 },

  // Section label
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textSub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  // Empty
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },

  // Match card
  matchCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  matchCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  matchInfo: { flex: 1, marginLeft: 12 },
  matchName: { fontSize: 16, fontWeight: '700', color: C.text },
  matchMeta: { fontSize: 13, color: C.textSub, marginTop: 2 },
  scoreBadge: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  matchTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  miniTag: {
    backgroundColor: C.surfaceHigh,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  miniTagText: { fontSize: 12, color: C.textSub },
  matchAvail: { fontSize: 12, color: C.textMuted, marginBottom: 12 },
  connectBtn: {
    backgroundColor: C.accent,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectBtnSent: { backgroundColor: C.surfaceHigh },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  connectBtnTextSent: { color: C.success },
});
