'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps } from '../types'

interface Question {
  id: string
  type: 'radio' | 'checkbox' | 'text' | 'rating'
  label: string
  options?: string[]
  required?: boolean
}

type ChartType = 'bar' | 'pie' | 'count'

// Aggregate results: { questionId: { optionOrValue: count } }
type ResultMap = Record<string, Record<string, number>>

function BarChart({ data, total }: { data: Record<string, number>; total: number }) {
  const max = Math.max(...Object.values(data), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Object.entries(data).map(([label, count]) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
            <span>{label}</span>
            <span>{count}명 ({total > 0 ? Math.round((count / total) * 100) : 0}%)</span>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PieChart({ data, total }: { data: Record<string, number>; total: number }) {
  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']
  const entries = Object.entries(data)
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 42
  const innerR = 24

  let cumAngle = -Math.PI / 2
  const slices = entries.map(([label, count], i) => {
    const pct = total > 0 ? count / total : 0
    const angle = pct * 2 * Math.PI
    const x1 = cx + r * Math.cos(cumAngle)
    const y1 = cy + r * Math.sin(cumAngle)
    cumAngle += angle
    const x2 = cx + r * Math.cos(cumAngle)
    const y2 = cy + r * Math.sin(cumAngle)
    const xi1 = cx + innerR * Math.cos(cumAngle - angle)
    const yi1 = cy + innerR * Math.sin(cumAngle - angle)
    const xi2 = cx + innerR * Math.cos(cumAngle)
    const yi2 = cy + innerR * Math.sin(cumAngle)
    const large = angle > Math.PI ? 1 : 0
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${large} 0 ${xi1} ${yi1} Z`
    return { d, color: COLORS[i % COLORS.length], label, count, pct }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} />
        ))}
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="var(--text-primary)" fontWeight="600">{total}명</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
            <span>{s.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CountChart({ data, total }: { data: Record<string, number>; total: number }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {Object.entries(data).map(([label, count]) => (
        <div key={label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-text)' }}>{count}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{label}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{total > 0 ? Math.round((count / total) * 100) : 0}%</div>
        </div>
      ))}
    </div>
  )
}

function ResultsView({ questions, results, chartType }: { questions: Question[]; results: ResultMap; chartType: ChartType }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {questions.map((q, idx) => {
        const qResult = results[q.id] || {}
        const total = Object.values(qResult).reduce((a, b) => a + b, 0)
        return (
          <div key={q.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              {idx + 1}. {q.label}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>({total}명 응답)</span>
            </p>
            {(q.type === 'radio' || q.type === 'checkbox') && total > 0 && (
              chartType === 'bar' ? <BarChart data={qResult} total={total} /> :
              chartType === 'pie' ? <PieChart data={qResult} total={total} /> :
              <CountChart data={qResult} total={total} />
            )}
            {q.type === 'rating' && total > 0 && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                평균: <span style={{ fontWeight: 700, color: 'var(--accent-text)' }}>
                  {(Object.entries(qResult).reduce((s, [v, c]) => s + Number(v) * c, 0) / total).toFixed(1)}
                </span> / 5
                <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({total}명)</span>
              </div>
            )}
            {q.type === 'text' && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>주관식 응답 {total}건</div>
            )}
            {total === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>응답 없음</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function SurveyComponent({ componentId, config }: ComponentProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [results, setResults] = useState<ResultMap | null>(null)
  const supabase = createClient()

  const title = (config.title as string) || '설문조사'
  const questions = (config.questions as Question[]) || []
  const allowMultiple = (config.allow_multiple as boolean) || false
  const showResults = (config.show_results as boolean) || false
  const chartType = ((config.result_chart_type as ChartType) || 'bar')

  useEffect(() => {
    const checkSubmission = async () => {
      if (allowMultiple) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('component_id', componentId)
        .eq('user_id', user.id)
        .single()
      if (data) {
        setAlreadySubmitted(true)
        if (showResults) fetchResults()
      }
    }
    checkSubmission()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, allowMultiple, showResults])

  const fetchResults = async () => {
    const { data } = await supabase
      .from('survey_responses')
      .select('answers')
      .eq('component_id', componentId)
    if (!data) return
    const map: ResultMap = {}
    for (const row of data) {
      const ans = row.answers as Record<string, unknown>
      for (const q of questions) {
        if (!map[q.id]) map[q.id] = {}
        const val = ans[q.id]
        if (val == null) continue
        if (Array.isArray(val)) {
          for (const v of val) {
            map[q.id][String(v)] = (map[q.id][String(v)] || 0) + 1
          }
        } else {
          map[q.id][String(val)] = (map[q.id][String(val)] || 0) + 1
        }
      }
    }
    setResults(map)
  }

  const handleAnswer = (questionId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleCheckbox = (questionId: string, option: string, checked: boolean) => {
    const current = (answers[questionId] as string[]) || []
    handleAnswer(questionId, checked ? [...current, option] : current.filter(v => v !== option))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('survey_responses').insert({
      component_id: componentId,
      user_id: user?.id || null,
      answers,
    })
    setSubmitted(true)
    if (showResults) fetchResults()
  }

  const doneStyle = { padding: '24px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px' }

  if (alreadySubmitted && !showResults) {
    return (
      <div style={doneStyle}>
        <div style={{ fontSize: '36px' }}>✅</div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>이미 응답하셨습니다. 감사합니다!</p>
      </div>
    )
  }

  if (alreadySubmitted && showResults && results) {
    return (
      <div style={{ padding: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{title}</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>이미 응답하셨습니다. 현재 결과를 보여드립니다.</p>
        <ResultsView questions={questions} results={results} chartType={chartType} />
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={doneStyle}>
          <div style={{ fontSize: '36px' }}>🎉</div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>응답이 제출되었습니다. 감사합니다!</p>
        </div>
        {showResults && results && (
          <>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>전체 응답 결과</p>
              <ResultsView questions={questions} results={results} chartType={chartType} />
            </div>
          </>
        )}
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '13px' }}>설문 문항이 없습니다. 관리자에서 문항을 추가해주세요.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>{title}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {questions.map((q, idx) => (
          <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              {idx + 1}. {q.label}
              {q.required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
            </p>

            {(q.type === 'radio') && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {q.options.map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <input type="radio" name={q.id} value={opt} required={q.required} onChange={() => handleAnswer(q.id, opt)} style={{ accentColor: 'var(--accent)' }} />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'checkbox' && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {q.options.map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <input type="checkbox" onChange={e => handleCheckbox(q.id, opt, e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                className="input"
                rows={3}
                required={q.required}
                onChange={e => handleAnswer(q.id, e.target.value)}
                style={{ width: '100%', resize: 'vertical', fontSize: '13px' }}
              />
            )}

            {q.type === 'rating' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleAnswer(q.id, n)}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                      background: answers[q.id] === n ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: answers[q.id] === n ? '#fff' : 'var(--text-primary)',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
          제출하기
        </button>
      </form>
    </div>
  )
}

export function SurveyConfigForm({ config, onChange }: { config: Record<string, unknown>, onChange: (c: Record<string, unknown>) => void }) {
  const questions = (config.questions as Question[]) || []
  const showResults = (config.show_results as boolean) || false
  const chartType = (config.result_chart_type as ChartType) || 'bar'

  const addQuestion = () => {
    const newQ: Question = {
      id: Date.now().toString(),
      type: 'radio',
      label: '',
      options: ['옵션 1', '옵션 2'],
      required: false,
    }
    onChange({ ...config, questions: [...questions, newQ] })
  }

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    const updated = questions.map((q, i) => i === idx ? { ...q, ...updates } : q)
    onChange({ ...config, questions: updated })
  }

  const removeQuestion = (idx: number) => {
    onChange({ ...config, questions: questions.filter((_, i) => i !== idx) })
  }

  const addOption = (qIdx: number) => {
    const q = questions[qIdx]
    const opts = [...(q.options || []), `옵션 ${(q.options?.length || 0) + 1}`]
    updateQuestion(qIdx, { options: opts })
  }

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    const opts = (questions[qIdx].options || []).map((o, i) => i === oIdx ? val : o)
    updateQuestion(qIdx, { options: opts })
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    const opts = (questions[qIdx].options || []).filter((_, i) => i !== oIdx)
    updateQuestion(qIdx, { options: opts })
  }

  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Title */}
      <div>
        <label style={labelStyle}>설문 제목</label>
        <input
          className="input"
          value={(config.title as string) || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
          style={{ fontSize: '13px' }}
        />
      </div>

      {/* Allow multiple */}
      <div style={rowStyle}>
        <input
          type="checkbox"
          id="allow_multiple"
          checked={(config.allow_multiple as boolean) || false}
          onChange={e => onChange({ ...config, allow_multiple: e.target.checked })}
          style={{ accentColor: 'var(--accent)', width: '14px', height: '14px' }}
        />
        <label htmlFor="allow_multiple" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>중복 응답 허용</label>
      </div>

      {/* Show results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={rowStyle}>
          <input
            type="checkbox"
            id="show_results"
            checked={showResults}
            onChange={e => onChange({ ...config, show_results: e.target.checked })}
            style={{ accentColor: 'var(--accent)', width: '14px', height: '14px' }}
          />
          <label htmlFor="show_results" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>제출 후 결과 보기</label>
        </div>
        {showResults && (
          <div style={{ paddingLeft: '22px' }}>
            <label style={labelStyle}>차트 유형</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['bar', 'pie', 'count'] as ChartType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ ...config, result_chart_type: t })}
                  className={chartType === t ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  {t === 'bar' ? '바 차트' : t === 'pie' ? '파이 차트' : '카운팅'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>문항 ({questions.length}개)</label>
          <button onClick={addQuestion} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>+ 문항 추가</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', background: 'var(--bg-secondary)' }}>
              {/* Question header */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <input
                  className="input"
                  placeholder="질문 내용"
                  value={q.label}
                  onChange={e => updateQuestion(idx, { label: e.target.value })}
                  style={{ flex: 1, fontSize: '13px' }}
                />
                <select
                  className="input"
                  value={q.type}
                  onChange={e => updateQuestion(idx, { type: e.target.value as Question['type'] })}
                  style={{ width: '100px', fontSize: '12px' }}
                >
                  <option value="radio">단일 선택</option>
                  <option value="checkbox">다중 선택</option>
                  <option value="text">텍스트</option>
                  <option value="rating">별점 (1-5)</option>
                </select>
                <button onClick={() => removeQuestion(idx)} className="btn-danger" style={{ padding: '4px 8px', fontSize: '12px' }}>✕</button>
              </div>

              {/* Required toggle */}
              <div style={{ ...rowStyle, marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id={`req-${q.id}`}
                  checked={q.required || false}
                  onChange={e => updateQuestion(idx, { required: e.target.checked })}
                  style={{ accentColor: 'var(--accent)', width: '12px', height: '12px' }}
                />
                <label htmlFor={`req-${q.id}`} style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>필수 항목</label>
              </div>

              {/* Options list for radio/checkbox */}
              {(q.type === 'radio' || q.type === 'checkbox') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {(q.options || []).map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: 'flex', gap: '4px' }}>
                      <input
                        className="input"
                        value={opt}
                        onChange={e => updateOption(idx, oIdx, e.target.value)}
                        placeholder={`옵션 ${oIdx + 1}`}
                        style={{ flex: 1, fontSize: '12px', padding: '5px 8px' }}
                      />
                      <button
                        onClick={() => removeOption(idx, oIdx)}
                        className="btn-ghost"
                        style={{ padding: '4px 7px', fontSize: '12px', color: 'var(--danger)' }}
                        title="옵션 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(idx)}
                    className="btn-ghost"
                    style={{ fontSize: '12px', padding: '5px 8px', textAlign: 'left', color: 'var(--accent-text)' }}
                  >
                    + 옵션 추가
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
