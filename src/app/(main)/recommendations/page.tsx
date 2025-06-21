"use client"

export default function RecommendationsPage() {
  return (
    <>
      <h1 className="page-title">新しい音楽を発見</h1>
      <p className="page-subtitle">あなたの視聴習慣に基づいて</p>
      
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>あなたへのおすすめ</h2>
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </>
  )
}