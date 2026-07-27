import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth.context';
import { supabase } from '../utils/supabaseClient';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const sampleStats = {
  labels: ['Users', 'Admins', 'Guests'],
  datasets: [
    {
      data: [72, 18, 10],
      backgroundColor: ['#1d4ed8', '#10b981', '#f59e0b'],
      hoverOffset: 4,
    },
  ],
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<{ totalUsers: number; adminCount: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(() => null);
    });
  }, [user]);

  return (
    <main className="container">
      <div className="header">
        <h1>Dashboard</h1>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
      <div className="stat-grid">
        <div className="card">
          <h2>Welcome</h2>
          <p>{user?.email}</p>
        </div>
        <div className="card">
          <h2>Stats</h2>
          <p>Total users: {stats?.totalUsers ?? 'Loading...'}</p>
          <p>Admins: {stats?.adminCount ?? 'Loading...'}</p>
        </div>
      </div>
      <div className="chart-card">
        <h2>Role Distribution</h2>
        <Pie data={sampleStats} />
      </div>
    </main>
  );
}
