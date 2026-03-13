import { useState } from 'react'
import { signIn, signUp } from '../lib/auth'
import { ensureMySeller } from '../lib/queries'

type Props = {
  onSuccess: () => void
}

export default function SignIn({ onSuccess }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        await signUp(email, password)
        const name = displayName.trim() || email.split('@')[0] || 'Seller'
        try {
          await ensureMySeller(name)
        } catch {
          // Seller may be created in App after redirect; continue so user gets to the app
        }
      } else {
        await signIn(email, password)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sign-in">
      <h2 className="sign-in__title">{isSignUp ? 'Create account' : 'Sign in'}</h2>
      <form className="sign-in__form" onSubmit={handleSubmit}>
        <label className="sign-in__label" htmlFor="signin-email">
          Email or username
        </label>
        <p className="sign-in__hint">Use a username as email (e.g. maria@stand). No real email needed.</p>
        <input
          id="signin-email"
          type="email"
          className="sign-in__input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="maria@stand"
        />
        {isSignUp && (
          <>
            <label className="sign-in__label" htmlFor="signin-displayname">
              Display name (for sales)
            </label>
            <input
              id="signin-displayname"
              type="text"
              className="sign-in__input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder="Your name"
            />
          </>
        )}
        <label className="sign-in__label" htmlFor="signin-password">
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          className="sign-in__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          minLength={6}
          placeholder={isSignUp ? 'Min 6 characters' : ''}
        />
        {error && <p className="sign-in__error" role="alert">{error}</p>}
        <button type="submit" className="sign-in__submit" disabled={loading}>
          {loading ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
        </button>
      </form>
      <button
        type="button"
        className="sign-in__toggle"
        onClick={() => { setIsSignUp((v) => !v); setError(null); }}
      >
        {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
      </button>
    </div>
  )
}
