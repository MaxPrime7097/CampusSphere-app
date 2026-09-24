import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getAnnale, askQuestion } from '../services/spheraApi'
import { normalizeAiResponse } from '../utils/normalizeAiResponse'
import { MessageSquare, Bot, User, Send, ArrowUp, Download, Loader2 } from 'lucide-react'
import { useDownloadPDF } from '../hooks/useDownloadPDF'

export default function AnnaleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [annale, setAnnale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true })
  const [activeTab, setActiveTab] = useState<'correction' | 'chat'>('correction')
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isChatting, setIsChatting] = useState(false)
  const { isDownloading, generateAnnale } = useDownloadPDF()

  useEffect(() => {
    if (!id) return
    getAnnale(id)
      .then(r => {
        const annaleData = r?.data ?? r
        setAnnale(annaleData)
        if (annaleData.qa_history) setChatHistory(annaleData.qa_history)
      })
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

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !id) return

    const msg = chatMessage
    setChatMessage('')
    setIsChatting(true)
    setActiveTab('chat')

    setChatHistory(prev => [...prev, { question: msg, answer: '...' }])

    try {
      const res = await askQuestion(id, msg, 'annale')
      const normalized = normalizeAiResponse(res?.data?.answer)
      setChatHistory(prev => {
        const newHist = [...prev]
        newHist[newHist.length - 1].answer = normalized
        return newHist
      })
    } catch (e) {
      setChatHistory(prev => {
        const newHist = [...prev]
        newHist[newHist.length - 1].answer = "Erreur de connexion avec l'assistant."
        return newHist
      })
    } finally {
      setIsChatting(false)
    }
  }

  return (
    <div style={{ padding: '2rem 1.25rem 4rem', maxWidth: 860, margin: '0 auto' }}>
      <div className="animate-in" style={{ marginBottom: '2rem' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-sm" style={{ marginBottom: '0.75rem' }}>← Tableau de bord</button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem' }}>{annale.resource_title || annale.source_filename || `Annale #${annale.id}`}</h1>
            <span className="badge badge-brand">{annale.mode === 'rapide' ? 'Rapide' : 'Complète'}</span>
          </div>
          <button
            onClick={() => generateAnnale(annale, annale.resource_title || annale.source_filename)}
            disabled={isDownloading}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            {isDownloading ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Download style={{ width: 14, height: 14 }} />}
            Télécharger PDF
          </button>
        </div>
        {annale.created_at && (
          <p style={{ color: 'var(--text-3)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {new Date(annale.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </p>
        )}
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('correction')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)',
              background: activeTab === 'correction' ? 'var(--brand)' : 'var(--bg-2)',
              color: activeTab === 'correction' ? 'white' : 'var(--text-2)',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}
          >
            Correction
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)',
              background: activeTab === 'chat' ? 'var(--brand)' : 'var(--bg-2)',
              color: activeTab === 'chat' ? 'white' : 'var(--text-2)',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              transition: 'all 0.2s',
            }}
          >
            Assistant
          </button>
        </div>
      </div>

      <div className="animate-in">
        {activeTab === 'correction' ? (
          <>
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
                    <span style={{ fontWeight: 700 }}>{sec.titre || sec.nom || sec.section || `Section ${si + 1}`}</span>
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
                            <pre><code>{q.correction || q.reponse || q.answer}</code></pre>
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
                            À retenir : {q.a_retenir}
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
          </>
        ) : (
          /* Chat Tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {chatHistory.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-2)',
                borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              }}>
                <MessageSquare style={{ width: '2.5rem', height: '2.5rem', color: 'var(--text-3)', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ color: 'white', fontWeight: 600, marginBottom: '0.5rem' }}>Posez vos questions</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Demandez des éclaircissements sur cette correction.</p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* User Message */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      background: 'var(--brand)', color: 'white', padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius)', maxWidth: '85%', borderBottomRightRadius: '0.25rem',
                    }}>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{msg.question}</p>
                    </div>
                    <div style={{
                      width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--bg-2)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <User style={{ width: '1rem', height: '1rem', color: 'var(--text-3)' }} />
                    </div>
                  </div>
                  {/* AI Response */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--bg-2)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Bot style={{ width: '1rem', height: '1rem', color: 'var(--brand)' }} />
                    </div>
                    <div style={{
                      background: 'var(--bg-2)', color: 'var(--text-2)', padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius)', maxWidth: '85%', borderBottomLeftRadius: '0.25rem',
                      border: '1px solid var(--border)',
                    }}>
                      {msg.answer === '...' ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'var(--text-2)', animation: 'bounce 1.4s infinite' }} />
                          <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'var(--text-2)', animation: 'bounce 1.4s infinite 0.2s' }} />
                          <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: 'var(--text-2)', animation: 'bounce 1.4s infinite 0.4s' }} />
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'white' }}>{msg.answer}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Chat Input (Fixed Bottom) */}
      {activeTab === 'chat' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(to top, var(--bg), transparent)',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Demandez n'importe quoi sur cette correction..."
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              style={{
                flex: 1, padding: '0.75rem 1rem', background: 'var(--bg-2)', color: 'white',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)', outline: 'none',
                fontSize: '0.9rem',
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSendChat()
              }}
            />
            <button
              onClick={handleSendChat}
              disabled={!chatMessage.trim() || isChatting}
              style={{
                padding: '0.75rem 1.25rem', background: chatMessage.trim() && !isChatting ? 'var(--brand)' : 'var(--text-3)',
                color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600,
                opacity: chatMessage.trim() && !isChatting ? 1 : 0.5, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}
            >
              <Send style={{ width: '1rem', height: '1rem' }} />
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

