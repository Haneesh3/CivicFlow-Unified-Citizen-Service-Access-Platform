import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await signUp(email, password, fullName);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign up.');
    }
  };

  return (
    <main className="container">
      <div className="card">
        <h1>Create account</h1>
        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <button type="submit">Sign Up</button>
        </form>
        <p>
          Already registered? <Link to="/signin">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
