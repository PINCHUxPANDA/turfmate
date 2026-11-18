'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, ShieldCheck, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { MatchChatBox } from '@/components/shared/MatchChatBox';
import { CompleteMatchPanel } from '@/components/shared/CompleteMatchPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MatchLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [joinError, setJoinError] = useState('');

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: async () => {
      const res = await api.get(`/matches/${id}`);
      return res.data.data;
    },
  });

  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

const completeMutation = useMutation({
  mutationFn: async () => {
    const payload = match.participants.map((p: any) => ({
      userId: p.userId,
      attended: attendance[p.userId] ?? true, // default checked
    }));
    return api.post(`/matches/${id}/complete`, { attendance: payload });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['match', id] });
  },
});

  // Listen for live Socket.io roster and status updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('join_match_room', id);

    const handleLobbyUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
    };

    socket.on('lobby_updated', handleLobbyUpdate);
    return () => {
      socket.off('lobby_updated', handleLobbyUpdate);
    };
  }, [id, queryClient]);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/matches/${id}/join`);
      return res.data.data;
    },
    onSuccess: () => {
      setJoinError('');
      queryClient.invalidateQueries({ queryKey: ['match', id] });
    },
    onError: (err: any) => {
      setJoinError(err.response?.data?.message || 'Unable to join match');
    },
  });

  if (isLoading) return <p className="py-12 text-center">Loading match lobby...</p>;
  if (!match) return <p className="py-12 text-center">Match not found.</p>;

  const isParticipant = match.participants.some((p: any) => p.userId === user?.id);
  const isHost = user?.id === match.hostId;
  const isClosed =
    match.status === 'FULL' ||
    match.status === 'COMPLETED' ||
    match.status === 'CANCELLED';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left 2 Columns: Match Details, Player Roster & Host Controls */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
        {/* Host Post-Match Attendance Controls */}
{match.hostId === user?.id && match.status !== 'COMPLETED' && (
  <Card className="border-emerald-200">
    <CardHeader>
      <CardTitle className="text-lg">Host Post-Match Attendance</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Uncheck any player who did not show up (ghosted) to adjust their Reliability Score.
      </p>

      {match.participants.map((p: any) => (
        <label
          key={p.id}
          className="flex items-center justify-between border rounded-md p-2.5 cursor-pointer hover:bg-muted/50"
        >
          <span className="text-sm font-medium">{p.user.name}</span>
          <input
            type="checkbox"
            checked={attendance[p.userId] ?? true}
            onChange={(e) =>
              setAttendance({ ...attendance, [p.userId]: e.target.checked })
            }
            className="h-4 w-4 accent-emerald-600"
          />
        </label>
      ))}

      <Button
        onClick={() => completeMutation.mutate()}
        disabled={completeMutation.isPending}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {completeMutation.isPending
          ? 'Finalizing...'
          : 'Complete Match & Update Reliability Scores'}
      </Button>
    </CardContent>
  </Card>
)}
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {match.sportType} • {match.skillLevel}
              </Badge>
              <Badge className="bg-emerald-600 text-white">{match.status}</Badge>
            </div>
            <CardTitle className="text-2xl mt-2">{match.title}</CardTitle>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-emerald-600" />
              {match.venue?.name || match.customLocation} ({match.city})
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {new Date(match.date).toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-600" />
                {match.participants.length} / {match.maxPlayers} Players
              </span>
              <span className="font-bold">₹{match.costPerPerson} / player</span>
            </div>

            {!isParticipant && (
              <div className="pt-2">
                <Button
                  onClick={() => joinMutation.mutate()}
                  disabled={!user || isClosed || joinMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {!user
                    ? 'Sign in to Join Lobby'
                    : match.status === 'FULL'
                    ? 'Lobby Full'
                    : isClosed
                    ? `Match ${match.status}`
                    : joinMutation.isPending
                    ? 'Reserving Spot...'
                    : 'Join Match Lobby'}
                </Button>
                {joinError && <p className="text-sm text-rose-600 mt-2">{joinError}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmed Roster */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Confirmed Roster ({match.participants.length}/{match.maxPlayers})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {match.participants.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.user.name}</span>
                  {p.userId === match.hostId && (
                    <Badge variant="secondary" className="text-xs">
                      Host
                    </Badge>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {p.user.reliabilityRating.toFixed(1)}★
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Host Post-Match Attendance & Reliability Scoring */}
        {isHost && (
          <CompleteMatchPanel
            matchId={match.id}
            participants={match.participants}
            matchStatus={match.status}
          />
        )}
      </div>

      {/* Right Column: Real-Time Lobby Chat */}
      <div>
        <MatchChatBox
          matchId={match.id}
          currentUserId={user?.id}
          initialMessages={match.messages || []}
          isParticipant={isParticipant}
        />
      </div>
    </div>
  );
}