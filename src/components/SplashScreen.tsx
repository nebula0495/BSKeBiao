import { useState, useEffect } from 'react'

interface Props {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: Props) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 500)
    const t2 = setTimeout(() => setPhase('out'), 2000)
    const t3 = setTimeout(() => onFinish(), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  return (
    <div style={{
      ...styles.container,
      opacity: phase === 'out' ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      <div style={{
        ...styles.content,
        transform: phase === 'in' ? 'translateY(10px)' : 'translateY(0)',
        opacity: phase === 'in' ? 0 : 1,
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out',
      }}>
        <div style={styles.logo}>📅</div>
        <h1 style={styles.title}>不上课表</h1>
        <p style={styles.subtitle}>今天不上课</p>
      </div>
      <div style={styles.loader}>
        <div style={styles.loaderBar} />
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'linear-gradient(135deg, #A8E6CF 0%, #22C55E 50%, #86EFAC 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  content: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  logo: { fontSize: 64 },
  title: {
    fontSize: 32, fontWeight: 800, color: 'white',
    letterSpacing: '2px', textShadow: '0 2px 10px rgba(0,0,0,0.2)',
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 400,
  },
  loader: {
    position: 'absolute', bottom: 80,
    width: 120, height: 3, background: 'rgba(255,255,255,0.2)',
    borderRadius: 2, overflow: 'hidden',
  },
  loaderBar: {
    width: '100%', height: '100%', background: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
    animation: 'splashLoad 2s ease-in-out forwards',
  },
}
