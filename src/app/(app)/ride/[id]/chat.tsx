import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthUser } from '@/components/providers/AuthProvider';

interface ChatMessage {
  id: string;
  ride_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
}

export default function RideChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  // Load existing message history
  useEffect(() => {
    if (!id) return;

    (async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, ride_id, user_id, content, created_at, profiles(username)')
        .eq('ride_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      type ChatRow = ChatMessage & { profiles: { username: string } };
      const rows = (data ?? []) as unknown as ChatRow[];

      setMessages(
        rows.map(row => ({
          id: row.id,
          ride_id: row.ride_id,
          user_id: row.user_id,
          content: row.content,
          created_at: row.created_at,
          username: row.profiles?.username,
        }))
      );
    })();
  }, [id]);

  // Subscribe to new messages via Postgres Changes (realtime insert events)
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `ride_id=eq.${id}` },
        async payload => {
          const newMsg = payload.new as ChatMessage;

          // Fetch the sender's username for display
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newMsg.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, username: profile?.username }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !id) return;

    const content = input.trim();
    setInput('');

    const { error } = await supabase.from('chat_messages').insert({
      ride_id: id,
      user_id: user.id,
      content,
    });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const isMine = item.user_id === user?.id;
            return (
              <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                <View style={[styles.bubble, isMine && styles.bubbleMine]}>
                  {!isMine && <Text style={styles.senderName}>{item.username}</Text>}
                  <Text style={[styles.messageText, isMine && styles.messageTextMine]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message"
            multiline
          />
          <Pressable onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bubbleMine: { backgroundColor: '#007AFF' },
  container: { backgroundColor: '#F2F2F7', flex: 1 },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputRow: {
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopColor: '#E5E5EA',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  messageList: { gap: 8, padding: 16 },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  messageRowMine: { justifyContent: 'flex-end' },
  messageText: { color: '#1C1C1E', fontSize: 15 },
  messageTextMine: { color: '#fff' },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  senderName: { color: '#8E8E93', fontSize: 11, fontWeight: '600', marginBottom: 2 },
});
