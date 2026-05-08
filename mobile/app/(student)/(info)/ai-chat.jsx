import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
  SafeAreaView,
  StatusBar as RNStatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../../../store/useAppStore';
import {
  getAiAssistantConfig,
  buildHousingAssistantSystemPrompt,
  aiAssistantHeaders,
  SUGGESTED_QUESTIONS,
  summarizeConversation,
} from '../../../config/aiAssistant';
import { retrieveHousingKnowledge } from '../../../utils/housingKbRetrieval';
import { isLikelyMealMenuQuestion, fetchTodayMealsForChat } from '../../../utils/mealMenuContext';

const copyToClipboard = async (text) => {
  try {
    const ExpoClipboard = require('expo-clipboard');
    if (ExpoClipboard?.setStringAsync) { await ExpoClipboard.setStringAsync(text); return; }
  } catch { }
  try {
    const { Clipboard: RNClipboard } = require('react-native');
    if (RNClipboard?.setString) RNClipboard.setString(text);
  } catch { }
};

function extractOllamaReply(data) {
  if (!data || typeof data !== 'object') return null;
  const fromChat = data.message?.content;
  if (typeof fromChat === 'string' && fromChat.length) return fromChat;
  const fromGen = data.response;
  if (typeof fromGen === 'string' && fromGen.length) return fromGen;
  return null;
}

function explainBadResponse(status, raw) {
  const head = (raw || '').slice(0, 280).trim();
  const lower = head.toLowerCase();
  if (lower.includes('<!doctype') || lower.includes('<html'))
    return 'السيرفر رجّع صفحة ويب — جرّب تشغيل ngrok أو حدّث AI_ASSISTANT_URL';
  if (!head) return `السيرفر ردّ فاضي (HTTP ${status})`;
  return `HTTP ${status}: ${head}`;
}

function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// ─── Markdown Parser ──────────────────────────────────────────────────────────
/**
 * Parses a markdown string into an array of "line blocks", each being an array
 * of inline segments { text, bold, italic }.
 * Supports: **bold**, *italic*, bullet lists (- or •), numbered lists, blank lines.
 */
function parseMarkdown(raw) {
  if (!raw) return [];

  const lines = raw.split('\n');
  const blocks = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      // blank line → spacer
      blocks.push({ type: 'spacer' });
      continue;
    }

    // Detect bullet
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    // Detect numbered list
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

    if (bulletMatch) {
      blocks.push({ type: 'bullet', segments: parseInline(bulletMatch[1]) });
    } else if (numberedMatch) {
      blocks.push({ type: 'numbered', number: numberedMatch[1], segments: parseInline(numberedMatch[2]) });
    } else {
      blocks.push({ type: 'paragraph', segments: parseInline(trimmed) });
    }
  }

  return blocks;
}

/**
 * Parses inline markdown (bold / italic) in a string.
 * Returns array of { text, bold, italic }.
 */
function parseInline(str) {
  const segments = [];
  // Regex: **bold**, *italic*, or plain text
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match[2] !== undefined) {
      segments.push({ text: match[2], bold: true, italic: false });
    } else if (match[3] !== undefined) {
      segments.push({ text: match[3], bold: false, italic: true });
    } else if (match[4] !== undefined) {
      segments.push({ text: match[4], bold: false, italic: false });
    }
  }
  return segments.length ? segments : [{ text: str, bold: false, italic: false }];
}

/** Renders inline segments (bold/italic/plain) as a <Text> node */
function InlineText({ segments, baseStyle }) {
  return (
    <Text style={baseStyle}>
      {segments.map((seg, idx) => (
        <Text
          key={idx}
          style={[
            seg.bold && { fontWeight: '800' },
            seg.italic && { fontStyle: 'italic' },
          ]}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

/** Renders a full parsed markdown block array */
function MarkdownMessage({ text, isUser }) {
  const blocks = parseMarkdown(text);
  const baseTextStyle = isUser ? s.textUser : s.textBot;

  return (
    <View>
      {blocks.map((block, idx) => {
        if (block.type === 'spacer') {
          return <View key={idx} style={{ height: 6 }} />;
        }
        if (block.type === 'bullet') {
          return (
            <View key={idx} style={s.listRow}>
              <Text style={[baseTextStyle, s.bullet]}>{'•'}</Text>
              <View style={s.listContent}>
                <InlineText segments={block.segments} baseStyle={[baseTextStyle, s.bubbleText]} />
              </View>
            </View>
          );
        }
        if (block.type === 'numbered') {
          return (
            <View key={idx} style={s.listRow}>
              <Text style={[baseTextStyle, s.bullet]}>{block.number + '.'}</Text>
              <View style={s.listContent}>
                <InlineText segments={block.segments} baseStyle={[baseTextStyle, s.bubbleText]} />
              </View>
            </View>
          );
        }
        // paragraph
        return (
          <InlineText
            key={idx}
            segments={block.segments}
            baseStyle={[baseTextStyle, s.bubbleText]}
          />
        );
      })}
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  PRIMARY:      '#4F46E5',
  PRIMARY_DARK: '#3730A3',
  BG:           '#F1F5F9',
  WHITE:        '#FFFFFF',
  TEXT:         '#0F172A',
  SUB:          '#64748B',
  BORDER:       '#E2E8F0',
  SUCCESS:      '#10B981',
  LIGHT:        '#EEF2FF',
  ERROR_BG:     '#FEF2F2',
  ERROR_BORDER: '#FECACA',
};

function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  React.useEffect(() => {
    dots.forEach((dot, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 180),
        Animated.timing(dot, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.25, duration: 380, useNativeDriver: true }),
      ])).start()
    );
  }, []);
  return (
    <View style={[s.row, s.rowBot]}>
      <View style={s.avatar}>
        <MaterialCommunityIcons name="robot-happy-outline" size={15} color={C.PRIMARY} />
      </View>
      <View style={[s.bubble, s.bubbleBot, { paddingVertical: 14, paddingHorizontal: 18 }]}>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {dots.map((dot, i) => (
            <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.PRIMARY, opacity: dot }} />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function AiChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const listRef = useRef(null);

  React.useEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          height: 65, paddingBottom: 10, paddingTop: 8,
          backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
          elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06, shadowRadius: 12,
        },
      });
    };
  }, [navigation]);

  const profile           = useAppStore((s) => s.profile);
  const bookings          = useAppStore((s) => s.bookings);
  const notifications     = useAppStore((s) => s.notifications);
  const unreadCount       = useAppStore((s) => s.unreadCount);
  const applicationStatus = useAppStore((s) => s.applicationStatus);

  const [input,        setInput]        = useState('');
  const [sending,      setSending]      = useState(false);
  const [items,        setItems]        = useState([]);
  const [conversation, setConversation] = useState([]);
  const [copiedId,     setCopiedId]     = useState(null);

  const appendMessage = useCallback((role, text) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setItems((prev) => [...prev, { id, role, text, timestamp: new Date() }]);
    return id;
  }, []);

  const handleCopy = useCallback(async (text, id) => {
    try {
      await copyToClipboard(text);
      setCopiedId(id);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => setCopiedId(null), 2000);
    } catch { }
  }, []);

  const buildLiveContext = useCallback(() => {
    if (!profile) return null;
    const recentNotif = notifications?.find(n => !n.read);
    return {
      name: profile.name,
      faculty: profile.faculty,
      studentId: profile.studentId,
      housingStatus: profile.housingStatus || applicationStatus || 'no_application',
      assignedRoom: profile.assignedRoomId?.roomNumber || profile.roomNumber,
      buildingName: profile.assignedRoomId?.buildingId?.name || profile.buildingName,
      bookings: (bookings || []).map(b => ({
        mealName: b.mealId?.name || b.mealName || 'وجبة',
        mealType: b.mealId?.type || b.mealType,
        date: b.date,
        status: b.status,
      })),
      unreadNotifications: unreadCount,
      totalNotifications: notifications?.length || 0,
      recentNotification: recentNotif?.message || recentNotif?.title || null,
    };
  }, [profile, bookings, notifications, unreadCount, applicationStatus]);

  const send = useCallback(async (overrideText) => {
    const trimmed = (overrideText || input).trim();
    if (!trimmed || sending) return;
    if (!overrideText) setInput('');
    appendMessage('user', trimmed);
    const nextConv = [...conversation, { role: 'user', content: trimmed }];
    setConversation(nextConv);
    setSending(true);

    const { url: baseUrl, model: modelName } = getAiAssistantConfig();
    const mealAppendix   = isLikelyMealMenuQuestion(trimmed) ? await fetchTodayMealsForChat() : null;
    const kbChunks       = retrieveHousingKnowledge(trimmed, 4);
    const studentContext = buildLiveContext();
    const convSummary    = summarizeConversation(nextConv);
    const systemPrompt   = buildHousingAssistantSystemPrompt(kbChunks, mealAppendix, studentContext, convSummary);
    const messagesToSend = nextConv.length > 12 && convSummary ? nextConv.slice(-8) : nextConv;
    const messages       = [{ role: 'system', content: systemPrompt }, ...messagesToSend];

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: aiAssistantHeaders(),
        body: JSON.stringify({
          model: modelName, messages, stream: false,
          options: { temperature: 0.2, top_p: 0.85, num_predict: 600, repeat_penalty: 1.2, top_k: 40 },
        }),
      });

      const raw = await res.text();
      let data;
      try { data = JSON.parse(raw); } catch { throw new Error(explainBadResponse(res.status, raw)); }
      if (!res.ok) throw new Error(data?.error || data?.message || explainBadResponse(res.status, raw));

      const reply = extractOllamaReply(data);
      if (!reply) throw new Error(data && typeof data === 'object' ? `شكل الرد مش متوقع (${Object.keys(data).join(', ')})` : 'رد السيرفر فاضي');

      setConversation((c) => [...c, { role: 'assistant', content: reply }]);
      appendMessage('assistant', reply);
    } catch (e) {
      let msg = e?.message || String(e);
      if (/Network request failed|Failed to fetch|ECONNREFUSED/i.test(msg))
        msg = 'مفيش اتصال بالسيرفر — تأكد إن الخدمة شغالة والموبايل على نفس الشبكة';
      setConversation((c) => [...c, { role: 'assistant', content: `⚠️ ${msg}` }]);
      appendMessage('assistant', `⚠️ ${msg}`);
    } finally {
      setSending(false);
    }
  }, [input, sending, conversation, appendMessage, buildLiveContext]);

  const clearChat = useCallback(() => {
    Alert.alert('مسح المحادثة', 'متأكد إنك عايز تمسح كل المحادثة؟', [
      { text: 'لأ', style: 'cancel' },
      { text: 'أيوه، امسح', style: 'destructive', onPress: () => { setItems([]); setConversation([]); } },
    ]);
  }, []);

  const renderItem = ({ item }) => {
    const isUser  = item.role === 'user';
    const isError = !isUser && item.text.startsWith('⚠️');
    return (
      <View style={[s.row, isUser ? s.rowUser : s.rowBot]}>
        {!isUser && (
          <View style={s.avatar}>
            <MaterialCommunityIcons name="robot-happy-outline" size={15} color={C.PRIMARY} />
          </View>
        )}
        <View style={{ maxWidth: '82%' }}>
          <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBot, isError && s.bubbleError]}>
            {/* ↓ استبدلنا <Text> العادي بـ MarkdownMessage */}
            <MarkdownMessage text={item.text} isUser={isUser} />
          </View>
          {!isUser && !isError && (
            <View style={s.msgActions}>
              <TouchableOpacity style={s.copyBtn} onPress={() => handleCopy(item.text, item.id)}>
                <MaterialCommunityIcons
                  name={copiedId === item.id ? 'check' : 'content-copy'}
                  size={12}
                  color={copiedId === item.id ? C.SUCCESS : C.SUB}
                />
                <Text style={[s.copyText, copiedId === item.id && { color: C.SUCCESS }]}>
                  {copiedId === item.id ? 'تم النسخ' : 'نسخ'}
                </Text>
              </TouchableOpacity>
              <Text style={s.ts}>{item.timestamp ? formatTime(item.timestamp) : ''}</Text>
            </View>
          )}
          {isUser && <Text style={s.tsUser}>{item.timestamp ? formatTime(item.timestamp) : ''}</Text>}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <MaterialCommunityIcons name="robot-happy-outline" size={40} color={C.PRIMARY} />
      </View>
      <Text style={s.emptyTitle}>مساعد السكن الذكي</Text>
      <Text style={s.emptyHint}>
        أهلاً{profile?.name ? ` ${profile.name.split(' ')[0]}` : ''}! 👋{'\n'}
        اسألني أي سؤال عن المدن الجامعية
      </Text>
      <View style={s.divider} />
      <Text style={s.sugLabel}>ابدأ بسؤال:</Text>
      {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
        <TouchableOpacity key={i} style={s.sugChip} onPress={() => send(q.text)} activeOpacity={0.75}>
          <Text style={s.sugIcon}>{q.icon}</Text>
          <Text style={s.sugText}>{q.text}</Text>
          <MaterialCommunityIcons name="arrow-left" size={14} color={C.SUB} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />

      <View style={s.topBar}>
        <View style={s.topLeft}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={s.topText}>محادثة آمنة</Text>
        </View>
        <Text style={s.topBrand}>AI Housing</Text>
        <View style={s.topRight}>
          <View style={[s.liveDot, sending && s.liveDotBusy]} />
          <Text style={s.topText}>{sending ? 'يعالج...' : 'متصل'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 56 : 0}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={C.PRIMARY} />
          </TouchableOpacity>
          <View style={s.headerMid}>
            <View style={s.headerAvatar}>
              <MaterialCommunityIcons name="robot-happy-outline" size={19} color={C.PRIMARY} />
            </View>
            <View>
              <Text style={s.headerTitle}>مساعد السكن</Text>
              <View style={s.statusRow}>
                <View style={[s.onlineDot, sending && s.busyDot]} />
                <Text style={s.headerSub}>{sending ? 'بيكتب الرد...' : 'متصل الآن'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={clearChat} style={s.iconBtn}>
            <MaterialCommunityIcons name="delete-sweep-outline" size={21} color={C.SUB} />
          </TouchableOpacity>
        </View>
     
        <FlatList
          style={{ flex: 1 , backgroundColor: C.BORDER,minHeight:'95%' }}
          ref={listRef}
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd?.({ animated: true })}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={sending ? <TypingIndicator /> : null}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        <View style={s.composer}>
          <TextInput
            style={s.input}
            placeholder="اكتب سؤالك هنا..."
            placeholderTextColor={C.SUB}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={800}
            editable={!sending}
            textAlign="right"
          />
          <TouchableOpacity
            style={[s.sendBtn, (sending || !input.trim()) && s.sendDisabled]}
            onPress={() => send()}
            disabled={sending || !input.trim()}
          >
            {sending
              ? <ActivityIndicator color={C.WHITE} size="small" />
              : <MaterialCommunityIcons name="send" size={19} color={C.WHITE} />
            }
          </TouchableOpacity>
        </View>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.BG },
  flex: { flex: 1, backgroundColor: C.BG },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 7,
    backgroundColor: C.PRIMARY,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 7 : 7,
  },
  topLeft:  { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'flex-end' },
  topBrand: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.95)', letterSpacing: 1.5, textTransform: 'uppercase' },
  topText:  { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.SUCCESS },
  liveDotBusy: { backgroundColor: '#F59E0B' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: C.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.BORDER,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  iconBtn: { padding: 8 },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 4 },
  headerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.LIGHT,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 14, fontWeight: '800', color: C.TEXT },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: C.SUCCESS },
  busyDot:     { backgroundColor: '#F59E0B' },
  headerSub:   { fontSize: 10, color: C.SUB, fontWeight: '500' },

  list: { padding: 14, paddingBottom: 16, paddingTop: 18, flexGrow: 1 },

  row:     { marginBottom: 8, flexDirection: 'row', alignItems: 'flex-end' },
  rowUser: { justifyContent: 'flex-end' },
  rowBot:  { justifyContent: 'flex-start' },

  avatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: C.LIGHT,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 6, marginBottom: 14,
  },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  bubbleUser: {
    backgroundColor: C.PRIMARY,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: C.WHITE,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.BORDER,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  bubbleError: { backgroundColor: C.ERROR_BG, borderColor: C.ERROR_BORDER },

  // ↓ Markdown styles
  bubbleText: { fontSize: 14.5, lineHeight: 23 },
  textUser:   { color: C.WHITE },
  textBot:    { color: C.TEXT },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  bullet: {
    fontSize: 14.5,
    lineHeight: 23,
    marginRight: 6,
    minWidth: 16,
  },
  listContent: { flex: 1 },

  msgActions: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3, paddingHorizontal: 2,
  },
  copyBtn:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 3 },
  copyText: { fontSize: 10, color: C.SUB, fontWeight: '500' },
  ts:       { fontSize: 9.5, color: C.SUB },
  tsUser:   { fontSize: 9.5, color: C.SUB, textAlign: 'right', marginTop: 3, marginRight: 3 },

  empty: { paddingTop: 32, alignItems: 'center', paddingHorizontal: 24, flex: 1 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.LIGHT,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.PRIMARY, marginBottom: 6 },
  emptyHint:  { fontSize: 13.5, color: C.SUB, textAlign: 'center', lineHeight: 21 },
  divider:    { height: StyleSheet.hairlineWidth, backgroundColor: C.BORDER, width: '100%', marginVertical: 16 },

  sugLabel:   { fontSize: 11, fontWeight: '700', color: C.SUB, alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  sugChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.WHITE,
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.BORDER,
    gap: 10, width: '100%', marginBottom: 8,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  sugIcon: { fontSize: 16 },
  sugText: { flex: 1, fontSize: 13, color: C.TEXT, textAlign: 'right' },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
    backgroundColor: C.WHITE,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    borderWidth: 1, borderColor: C.BORDER,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11,
    fontSize: 14.5, color: C.TEXT, backgroundColor: C.BG,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.PRIMARY,
    justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: C.PRIMARY,
  },
  sendDisabled: { opacity: 0.35 },
});