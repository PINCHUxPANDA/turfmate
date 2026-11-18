'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CreateMatchPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedCity } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    sportType: 'FOOTBALL',
    skillLevel: 'INTERMEDIATE',
    customLocation: '',
    date: '',
    maxPlayers: 10,
    costPerPerson: 200,
  });

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg font-medium">Please sign in using the top right button to host a match.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/matches', {
        ...form,
        city: selectedCity,
        date: new Date(form.date).toISOString(),
        maxPlayers: Number(form.maxPlayers),
        costPerPerson: Number(form.costPerPerson),
      });
      router.push(`/matches/${res.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Host a Match in {selectedCity}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Match Title (e.g., Sunday Morning 5v5)"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.sportType}
              onChange={(e) => setForm({ ...form, sportType: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value="FOOTBALL">Football</option>
              <option value="CRICKET">Cricket</option>
              <option value="BADMINTON">Badminton</option>
              <option value="PICKLEBALL">Pickleball</option>
              <option value="BASKETBALL">Basketball</option>
            </select>
            <select
              value={form.skillLevel}
              onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}
              className="rounded-md border px-3 py-2 text-sm bg-background"
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
          <Input
            placeholder="Turf Name or Public Ground Location"
            required
            value={form.customLocation}
            onChange={(e) => setForm({ ...form, customLocation: e.target.value })}
          />
          <Input
            type="datetime-local"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Max Players</label>
              <Input
                type="number"
                min={2}
                max={30}
                required
                value={form.maxPlayers}
                onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cost Per Player (₹)</label>
              <Input
                type="number"
                min={0}
                required
                value={form.costPerPerson}
                onChange={(e) => setForm({ ...form, costPerPerson: Number(e.target.value) })}
              />
            </div>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? 'Creating Lobby...' : 'Publish Match Lobby'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}