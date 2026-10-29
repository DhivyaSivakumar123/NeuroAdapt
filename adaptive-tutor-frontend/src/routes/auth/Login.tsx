import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Brain, Lock, Mail } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, session, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError('Please enter email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setFormError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f3fa] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-brand-600 text-white rounded-2xl shadow-xs mb-1">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Clarity</h1>
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Adaptive Learning Platform</p>
          <p className="text-xs text-slate-500 pt-1">Sign in to continue your personalized learning session</p>
        </div>

        <Card glass className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <div className="relative">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full py-3" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
            <p className="text-xs font-semibold text-slate-600 text-center uppercase tracking-wider">
              Or Instant Demo Sign-In
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs py-2"
                onClick={() => {
                  setEmail('student.test@example.com');
                  setPassword('Password123!');
                  login('student.test@example.com', 'Password123!');
                }}
              >
                🎓 Student
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs py-2"
                onClick={() => {
                  setEmail('parent.test@example.com');
                  setPassword('Password123!');
                  login('parent.test@example.com', 'Password123!');
                }}
              >
                👥 Parent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs py-2"
                onClick={() => {
                  setEmail('teacher.test@example.com');
                  setPassword('Password123!');
                  login('teacher.test@example.com', 'Password123!');
                }}
              >
                👨‍🏫 Teacher
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
