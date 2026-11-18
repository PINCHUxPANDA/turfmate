'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Participant {
  userId: string;
  user: {
    id: string;
    name: string;
    reliabilityRating: number;
  };
}

interface CompleteMatchPanelProps {
  matchId: string;
  participants: Participant[];
  matchStatus: string;
}

export function CompleteMatchPanel({
  matchId,
  participants,
  matchStatus,
}: CompleteMatchPanelProps) {
  const queryClient = useQueryClient();
  const [attendance, setAttendance] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(participants.map((p) => [p.userId, true]))
  );
  const [error, setError] = useState('');

  const completeMutation = useMutation({
    mutationFn: async () => {
      const attendees = participants.map((p) => ({
        userId: p.userId,
        attended: attendance[p.userId] ?? true,
      }));
      const res = await api.post(`/matches/${matchId}/complete`, { attendees });
      return res.data;
    },
    onSuccess: () => {
      setError('');
      queryClient.invalidateQueries({ queryKey: ['match', matchId] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to complete match');
    },
  });

  if (matchStatus === 'COMPLETED') {
    return (
      <Card className="border-emerald-200 bg-emerald-500/10">
        <CardContent className="flex items-center gap-2 py-4 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Match completed! Player reliability scores have been updated.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Host Controls: Confirm Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Uncheck any player who did not show up. Attendance updates each player&apos;s Reliability Score (1.0–5.0).
        </p>

        <div className="space-y-2">
          {participants.map((p) => (
            <label
              key={p.userId}
              className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
            >
              <span className="text-sm font-medium">{p.user.name}</span>
              <input
                type="checkbox"
                checked={attendance[p.userId] ?? true}
                onChange={(e) =>
                  setAttendance((prev) => ({
                    ...prev,
                    [p.userId]: e.target.checked,
                  }))
                }
                className="h-4 w-4 accent-emerald-600"
              />
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {completeMutation.isPending ? 'Submitting Scores...' : 'Complete Match & Update Scores'}
        </Button>
      </CardContent>
    </Card>
  );
}