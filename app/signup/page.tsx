'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async () => {
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem!')
      return
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres!')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '12px' }}>
            Confirme seu Email!
          </h2>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
            Enviamos um link de confirmação para <strong>{email}</strong>. 
            Clique no link para ativar sua conta!
          </p>
          <Link href="/login" style={{
            display: 'block',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '14px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            Ir para Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '48px' }}>🧠</div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e', margin: '10px 0 5px' }}>
            Criar Conta
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Comece a salvar suas memórias!</p>
        </div>

        {/* Formulário */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
              Confirmar Senha
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              ❌ {error}
            </div>
          )}

          <button
            onClick={handleSignup}
            disabled={loading || !email || !password || !confirm}
            style={{
              background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {loading ? '⏳ Criando conta...' : '🚀 Criar Conta Grátis'}
          </button>
        </div>

        {/* Link para login */}
        <div style={{ textAlign: 'center', marginTop: '24px', color: '#666', fontSize: '14px' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: '#667eea', fontWeight: '600', textDecoration: 'none' }}>
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}