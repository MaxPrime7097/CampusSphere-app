import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAnnale } from '../services/spheraApi'

export default function AnnaleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [annale, setAnnale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true })

  useEffect(() => {
    if (!id) return
    getAnnale(id)
      .then(r => setAnnale(r?.data ?? r))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius)', marginBottom: '1rem' }} />)}
    </div>
  )
  if (!annale) return null

  const content = annale.content || {}
  const sections = content.sections || []
  const corrections = content.corrections || []

  const typeColor: Record<string, string> = {
    qcm: 'var(--blue)', ouvert: 'var(--text-2)', code: 'var(--purple)', preuve: 'var(--green)', annale: 'var(--brand)',
  }
  const typeBadge: Record<string, string> = {
    qcm: 'QCM', ouvert: 'Ouvert', code: 'Code', preuve: 'Preuve',
  }

  return (
    <div style={{ padding: '2rem 1.25rem 4rem', maxWidth: 860, margin: '0 auto' }}>
      <div className="animate-in" style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem' }}>← Tableau de bord</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem' }}>{annale.resource_title || annale.source_filename || `Annale #${annale.id}`}</h1>
          <span className="badge badge-brand">{annale.mode === 'rapide' ? '⚡ Rapide' : '📚 Complète'}</span>
        </div>
        {annale.created_at && (
          <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {new Date(annale.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </p>
        )}
      </div>

      <div className="animate-in">
        {/* Format V2 : sections */}
        {sections.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sections.map((sec: any, si: number) => (
              <div key={si} className="card">
                <button
                  onClick={() => setOpenSections(prev => ({ ...prev, [si]: !prev[si] }))}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 700 }}>{sec.titre || sec.section || `Section ${si + 1}`}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                      {(sec.questions || []).length} question{(sec.questions || []).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-3)' }}>{openSections[si] ? '−' : '+'}</span>
                </button>

                {openSections[si] && (
                  <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(sec.questions || []).map((q: any, qi: number) => (
                      <div key={qi} style={{
                        borderLeft: `3px solid ${typeColor[q.type] || 'var(--border-hov)'}`,
                        paddingLeft: '1rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-2)' }}>
                            {q.numero ? `Q${q.numero}` : `${qi + 1}`}.
                          </span>
                          {q.type && (
                            <span style={{
                              fontSize: '0.65rem', fontWeight: 700, color: typeColor[q.type] || 'var(--text-3)',
                              background: `${typeColor[q.type] || 'transparent'}20`, padding: '0.15rem 0.45rem', borderRadius: 4,
                            }}>
                              {typeBadge[q.type] || q.type}
                            </span>
                          )}
                        </div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                          {q.enonce || q.question}
                        </p>
                        {/* Code type */}
                        {q.type === 'code' ? (
                          <div className="code-block" style={{ marginBottom: '0.5rem' }}>
                            <pre><code>{q.correction || q.reponse}</code></pre>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.7 }}>
                            {q.correction || q.reponse || q.answer}
                          </p>
                        )}
                        {q.a_retenir && (
                          <div style={{
                            marginTop: '0.65rem', padding: '0.5rem 0.85rem',
                            background: 'var(--brand-dim)', borderRadius: 'var(--radius-sm)',
                            fontSize: '0.82rem', color: 'var(--brand)',
                          }}>
                            ✨ À retenir : {q.a_retenir}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : corrections.length > 0 ? (
          /* Format legacy */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {corrections.map((c: any, i: number) => (
              <div key={i} className="card" style={{ padding: '1.25rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{c.question}</p>
                <p style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>{c.correction}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-2)' }}>Correction non disponible.</p>
          </div>
        )}
      </div>
    </div>
  )
}
