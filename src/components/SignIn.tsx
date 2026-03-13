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
        const name = displayName.trim() || email.split('@')[0] || 'Vendedor'
        try {
          await ensureMySeller(name)
        } catch {
          // Puede crearse en App tras redireccionar; continuar para entrar a la app
        }
      } else {
        await signIn(email, password)
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="sign-in">
      <h2 className="sign-in__title">{isSignUp ? 'Crear cuenta' : 'Iniciar sesion'}</h2>
      <form className="sign-in__form" onSubmit={handleSubmit}>
        <label className="sign-in__label" htmlFor="signin-email">
          Correo o usuario
        </label>
        <p className="sign-in__hint">
          Usa tu usuario como correo (ejemplo: maria@stand). No hace falta correo real.
        </p>
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
              Nombre visible (para ventas)
            </label>
            <input
              id="signin-displayname"
              type="text"
              className="sign-in__input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder="Tu nombre"
            />
          </>
        )}
        <label className="sign-in__label" htmlFor="signin-password">
          Contrasena
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
          placeholder={isSignUp ? 'Minimo 6 caracteres' : ''}
        />
        {error && <p className="sign-in__error" role="alert">{error}</p>}
        <button type="submit" className="sign-in__submit" disabled={loading}>
          {loading ? 'Espera…' : isSignUp ? 'Registrarse' : 'Entrar'}
        </button>
      </form>
      <button
        type="button"
        className="sign-in__toggle"
        onClick={() => { setIsSignUp((v) => !v); setError(null); }}
      >
        {isSignUp ? 'Ya tienes cuenta? Inicia sesion' : 'No tienes cuenta? Registrate'}
      </button>
    </div>
  )
}
