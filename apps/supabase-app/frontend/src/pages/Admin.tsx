import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth.context';
import { supabase } from '../utils/supabaseClient';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => setUsers(data.users || []));
    });
  }, [user]);

  return (
    <main className="container">
      <div className="card">
        <h1>Admin Dashboard</h1>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Full name</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.full_name}</td>
                <td>{user.role}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
