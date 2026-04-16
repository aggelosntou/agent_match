import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/constants/api';
import { useAuth } from '@/context/auth';

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
  error: '#FF453A',
  errorDim: '#FF453A18',
  blue: '#0A84FF',
};

// ── Types ──────────────────────────────────────────────────────────────────

type ConnectRequest = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  activity: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  from_user?: { id: string; name: string; location: string };
  to_user?: { id: string; name: string; location: string };
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `hsl(${hue}, 55%, 38%)`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontSize: size * 0.36, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

// ── ConnectsScreen ─────────────────────────────────────────────────────────

export default function ConnectsScreen() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<ConnectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openChat, setOpenChat] = useState<ConnectRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRequests(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const fetchMessages = useCallback(async (requestId: string) => {
    const res = await fetch(`${API_BASE_URL}/connect/${requestId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setMessages(await res.json());
  }, [token]);

  const openChatFor = (req: ConnectRequest) => {
    setOpenChat(req);
    fetchMessages(req.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !openChat) return;
    try {
      setSendingMessage(true);
      const res = await fetch(`${API_BASE_URL}/connect/${openChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage('');
        await fetchMessages(openChat.id);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const respondToRequest = async (id: string, newStatus: 'accepted' | 'declined') => {
    const res = await fetch(`${API_BASE_URL}/connect/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchRequests();
      Alert.alert(newStatus === 'accepted' ? '🎉 Connected!' : 'Declined', '');
    }
  };

  // ── Chat view ──────────────────────────────────────────────────────────────
  if (openChat) {
    const other = openChat.from_user_id === user?.id ? openChat.to_user : openChat.from_user;
    return (
      <SafeAreaView style={s.container}>
        <StatusBar barStyle="light-content" />
        <View style={s.chatHeader}>
          <Pressable onPress={() => setOpenChat(null)} style={s.backBtn}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>
          <View style={s.chatHeaderInfo}>
            {other && <Avatar name={other.name} size={36} />}
            <View style={{ marginLeft: 10 }}>
              <Text style={s.chatName}>{other?.name}</Text>
              {openChat.activity && (
                <Text style={s.chatActivity}>{openChat.activity}</Text>
              )}
            </View>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={s.messageList}
          renderItem={({ item }) => {
            const isMine = item.sender_id === user?.id;
            return (
              <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
                <Text style={[s.bubbleText, isMine && s.bubbleTextMine]}>
                  {item.content}
                </Text>
              </View>
            );
          }}
        />

        <View style={s.inputRow}>
          <TextInput
            style={s.messageInput}
            placeholder="Message…"
            placeholderTextColor={C.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable style={s.sendBtn} onPress={sendMessage} disabled={sendingMessage}>
            {sendingMessage
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.sendText}>↑</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Connects list ──────────────────────────────────────────────────────────
  const incoming = requests.filter(r => r.to_user_id === user?.id && r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const sent = requests.filter(r => r.from_user_id === user?.id && r.status === 'pending');

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <Text style={s.pageTitle}>Connects</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={C.accent} />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchRequests(); }}
              tintColor={C.accent}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Incoming requests */}
              {incoming.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Requests for you · {incoming.length}</Text>
                  {incoming.map(req => (
                    <View key={req.id} style={s.card}>
                      <View style={s.cardTop}>
                        {req.from_user && <Avatar name={req.from_user.name} size={44} />}
                        <View style={s.cardInfo}>
                          <Text style={s.cardName}>{req.from_user?.name}</Text>
                          {req.activity && (
                            <Text style={s.cardMeta}>{req.activity}</Text>
                          )}
                          {req.message && (
                            <Text style={s.cardQuote}>"{req.message}"</Text>
                          )}
                        </View>
                      </View>
                      <View style={s.actionRow}>
                        <Pressable
                          style={s.acceptBtn}
                          onPress={() => respondToRequest(req.id, 'accepted')}
                        >
                          <Text style={s.acceptText}>Accept</Text>
                        </Pressable>
                        <Pressable
                          style={s.declineBtn}
                          onPress={() => respondToRequest(req.id, 'declined')}
                        >
                          <Text style={s.declineText}>Decline</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Active chats */}
              {accepted.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Chats</Text>
                  {accepted.map(req => {
                    const other = req.from_user_id === user?.id ? req.to_user : req.from_user;
                    return (
                      <Pressable
                        key={req.id}
                        style={({ pressed }) => [s.card, pressed && { opacity: 0.75 }]}
                        onPress={() => openChatFor(req)}
                      >
                        <View style={s.cardTop}>
                          {other && <Avatar name={other.name} size={44} />}
                          <View style={s.cardInfo}>
                            <Text style={s.cardName}>{other?.name}</Text>
                            {req.activity && (
                              <Text style={s.cardMeta}>{req.activity}</Text>
                            )}
                          </View>
                          <Text style={s.chevron}>→</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Sent pending */}
              {sent.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionLabel}>Sent requests</Text>
                  {sent.map(req => (
                    <View key={req.id} style={[s.card, s.cardMuted]}>
                      <View style={s.cardTop}>
                        {req.to_user && <Avatar name={req.to_user.name} size={44} />}
                        <View style={s.cardInfo}>
                          <Text style={s.cardName}>{req.to_user?.name}</Text>
                          {req.activity && (
                            <Text style={s.cardMeta}>{req.activity}</Text>
                          )}
                          <Text style={s.pendingPill}>Pending…</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Empty */}
              {incoming.length === 0 && accepted.length === 0 && sent.length === 0 && (
                <View style={s.emptyBox}>
                  <Text style={s.emptyIcon}>🤝</Text>
                  <Text style={s.emptyTitle}>No connects yet</Text>
                  <Text style={s.emptyText}>
                    Search for an activity on the home tab and tap Connect on a match.
                  </Text>
                </View>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { paddingBottom: 40 },

  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Sections
  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  cardMuted: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 16, fontWeight: '700', color: C.text },
  cardMeta: { fontSize: 13, color: C.textSub, marginTop: 2 },
  cardQuote: { fontSize: 13, color: C.textSub, fontStyle: 'italic', marginTop: 4 },
  chevron: { fontSize: 18, color: C.textMuted },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptBtn: {
    flex: 1,
    backgroundColor: C.success,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  declineBtn: {
    flex: 1,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  declineText: { color: C.textSub, fontWeight: '600', fontSize: 14 },

  // Pending pill
  pendingPill: {
    fontSize: 12,
    color: C.accent,
    marginTop: 4,
    fontWeight: '600',
  },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.textSub, textAlign: 'center', lineHeight: 20 },

  // Chat header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { fontSize: 16, color: C.accent, fontWeight: '600' },
  chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  chatName: { fontSize: 16, fontWeight: '700', color: C.text },
  chatActivity: { fontSize: 13, color: C.textSub, marginTop: 1 },

  // Messages
  messageList: { padding: 16, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: C.surfaceHigh,
    alignSelf: 'flex-start',
  },
  bubbleMine: {
    backgroundColor: C.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: C.text, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },

  // Message input
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  messageInput: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: C.accent,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
