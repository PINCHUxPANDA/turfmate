'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { MatchCard } from '@/components/shared/MatchCard';
import { MatchCardSkeleton } from '@/components/shared/MatchCardSkeleton';
import { Button } from '@/components/ui/button';

const SPORTS = ['ALL', 'FOOTBALL', 'CRICKET', 'BADMINTON', 'PICKLEBALL', 'BASKETBALL'];

export default function HomePage() {
  const { selectedCity, selectedSport, setSelectedSport } = useAppStore();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', selectedCity, selectedSport],
    queryFn: async () => {
      const params: Record<string, string> = { city: selectedCity };
      if (selectedSport !== 'ALL') params.sport = selectedSport;
      const res = await api.get('/matches', { params });
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Open Matches in <span className="text-emerald-600">{selectedCity}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Join an upcoming game lobby or host your own match on a local turf.
        </p>
      </div>

      {/* Sport Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {SPORTS.map((sport) => (
          <Button
            key={sport}
            size="sm"
            variant={selectedSport === sport ? 'default' : 'outline'}
            onClick={() => setSelectedSport(sport)}
            className={selectedSport === sport ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
          >
            {sport === 'ALL' ? 'All Sports' : sport}
          </Button>
        ))}
      </div>

      {/* Live Match Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <MatchCardSkeleton key={n} />
          ))}
        </div>
      ) : matches.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((m: any) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="block">
              <MatchCard
                match={{
                  id: m.id,
                  sportType: m.sportType,
                  title: m.title,
                  venueName: m.venue?.name || m.customLocation || 'Public Ground',
                  city: m.city,
                  isPublicGround: !m.venueId,
                  date: new Date(m.date).toLocaleDateString(),
                  timeSlot: new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  currentPlayers: m._count?.participants ?? 1,
                  maxPlayers: m.maxPlayers,
                  costPerPerson: m.costPerPerson,
                  skillLevel: m.skillLevel,
                  status: m.status,
                  host: m.host,
                }}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No open matches in {selectedCity}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to host a game in {selectedCity}!
          </p>
        </div>
      )}
    </div>
  );
}