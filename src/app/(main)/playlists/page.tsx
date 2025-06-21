"use client"

export default function PlaylistsPage() {
  return (
    <>
      <h1 className="page-title">プレイリスト</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ cursor: 'pointer' }}>
          <div style={{ height: '200px', background: 'var(--aurora-gradient)', borderRadius: '12px', marginBottom: '1rem' }}></div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>チルバイブス</h3>
          <p style={{ color: 'var(--dark-gray)' }}>42曲 • 2時間15分</p>
        </div>
        <div className="card" style={{ cursor: 'pointer' }}>
          <div style={{ height: '200px', background: 'linear-gradient(135deg, #667eea 0%, #00d4ff 100%)', borderRadius: '12px', marginBottom: '1rem' }}></div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>ワークアウト</h3>
          <p style={{ color: 'var(--dark-gray)' }}>38曲 • 1時間52分</p>
        </div>
        <div className="card" style={{ cursor: 'pointer' }}>
          <div style={{ height: '200px', background: 'linear-gradient(135deg, #ff375f 0%, #ff9500 100%)', borderRadius: '12px', marginBottom: '1rem' }}></div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>集中用BGM</h3>
          <p style={{ color: 'var(--dark-gray)' }}>56曲 • 3時間21分</p>
        </div>
      </div>
    </>
  )
}