import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { UserRole } from '../../types/auth';
import { Brain, GraduationCap, Users, UserCheck } from 'lucide-react';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, session, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password || !displayName) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signup(email, password, role, displayName);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
        setFormError('Supabase signup rate limit reached for this IP. Please wait a few minutes before trying again, or use existing credentials on the Sign In page.');
      } else {
        setFormError(msg || 'Signup failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions: { role: UserRole; title: string; desc: string; icon: any }[] = [
    { role: 'student', title: 'Student', desc: 'Complete adaptive tasks', icon: GraduationCap },
    { role: 'parent', title: 'Parent', desc: 'Monitor children progress', icon: Users },
    { role: 'teacher', title: 'Teacher', desc: 'Manage student classes', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f0f3fa] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-brand-600 text-white rounded-2xl shadow-xs mb-1">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Clarity</h1>
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Adaptive Learning Platform</p>
          <p className="text-xs text-slate-500 pt-1">Create your account and select your learning role</p>
        </div>

        <Card glass className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium space-y-2">
                <p>{formError}</p>
                {formError.includes('rate limit') && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full bg-white text-brand-700 border-brand-300 hover:bg-brand-50"
                      onClick={() => navigate('/login')}
                    >
                      👉 Go to Sign In (Instant Demo Login Available)
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((opt) => {
                  const Icon = opt.icon;
                  const selected = role === opt.role;
                  return (
                    <button
                      key={opt.role}
                      type="button"
                      onClick={() => setRole(opt.role)}
                      className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                        selected
                          ? 'border-brand-600 bg-brand-50/70 text-brand-700 shadow-sm ring-1 ring-brand-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{opt.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Full Name / Display Name"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" className="w-full py-3" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
