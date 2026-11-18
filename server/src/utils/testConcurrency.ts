import axios from 'axios';

const API = 'http://localhost:5000/api';

async function runTest() {
  // 1. Register a host and create a 2-player match
  const hostRes = await axios.post(`${API}/auth/register`, {
    name: 'Host User',
    email: `host_${Date.now()}@test.com`,
    password: 'Password123!',
    city: 'Jaipur',
  });
  const hostToken = hostRes.data.token;

  const matchRes = await axios.post(
    `${API}/matches`,
    {
      title: 'Concurrency Stress Test (Max 2)',
      customLocation: 'Central Park Turf',
      city: 'Jaipur',
      sportType: 'BADMINTON',
      skillLevel: 'INTERMEDIATE',
      date: new Date(Date.now() + 86400000).toISOString(),
      maxPlayers: 2, // Only 1 spot left after host!
      costPerPerson: 150,
    },
    { headers: { Authorization: `Bearer ${hostToken}` } }
  );
  const matchId = matchRes.data.data.id;

  // 2. Register 5 separate players
  const tokens = await Promise.all(
    [1, 2, 3, 4, 5].map(async (i) => {
      const res = await axios.post(`${API}/auth/register`, {
        name: `Player ${i}`,
        email: `p${i}_${Date.now()}@test.com`,
        password: 'Password123!',
        city: 'Jaipur',
      });
      return res.data.token;
    })
  );

  // 3. Fire 5 simultaneous POST /join requests at the exact same millisecond
  const results = await Promise.allSettled(
    tokens.map((token) =>
      axios.post(`${API}/matches/${matchId}/join`, {}, { headers: { Authorization: `Bearer ${token}` } })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const rejected = results.filter((r) => r.status === 'rejected').length;

  console.log(`Concurrent Join Results -> Succeeded: ${succeeded} (Expected: 1), Rejected: ${rejected} (Expected: 4)`);
}

runTest();