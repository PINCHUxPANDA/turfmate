'use client';

import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export interface ChatMsg {
  id: string;
  message: string;
  createdAt: string;
  sender: { id: string; name: string };
}

interface MatchChatBoxProps {
  matchId: string;
  currentUserId?: string;
  initialMessages: ChatMsg[];
  isParticipant: boolean;
}

export function MatchChatBox({
  matchId,
  currentUserId,
  initialMessages,
  isParticipant,
}: MatchChatBoxProps) {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [input, setInput] = useState('');

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('join_match_room', matchId);

    const handleReceive = (newMsg: ChatMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    };

    socket.on('receive_message', handleReceive);

    return () => {
      socket.emit('leave_match_room', matchId);
      socket.off('receive_message', handleReceive);
    };
  }, [matchId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUserId) return;

    const socket = getSocket();
    socket.emit('send_message', {
      matchId,
      senderId: currentUserId,
      message: input,
    });
    setInput('');
  };

  return (
    <Card className="flex flex-col h-[460px]">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-base">Lobby Coordination Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-12">
            No messages yet. Coordinate jersey colors, bibs, or arrival time!
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  isMe
                    ? 'ml-auto bg-emerald-600 text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                {!isMe && (
                  <span className="text-xs font-semibold text-emerald-700 mb-0.5">
                    {msg.sender.name}
                  </span>
                )}
                <span>{msg.message}</span>
              </div>
            );
          })
        )}
      </CardContent>

      <CardFooter className="border-t p-3">
        <form onSubmit={handleSend} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isParticipant
                ? 'Type a message (e.g., Bring dark shirts)...'
                : 'Join the match lobby to chat'
            }
            disabled={!isParticipant}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!isParticipant || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}