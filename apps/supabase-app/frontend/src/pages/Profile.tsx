import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth.context';
import { supabase } from '../utils/supabaseClient';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!user) return;

    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setProfile(data.profile);
          setFullName(data.profile?.full_name ?? '');
          setBio(data.profile?.bio ?? '');
          setLocation(data.profile?.location ?? '');
        });
    });
  }, [user]);

  const update = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fullName, bio, location }),
    });
  };

  const remove = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  return (
    <main className="container">
      <div className="card">
        <h1>Profile</h1>
        <label>Full name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} />
        <label>Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} />
        <label>Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} />
        <button onClick={update}>Update Profile</button>
        <button className="danger" onClick={remove}>Delete Profile</button>
      </div>
    </main>
  );
}
