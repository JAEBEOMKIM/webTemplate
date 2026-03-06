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

export function SurveyComponent({ componentId, config }: ComponentProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [submitted, setSubmitted] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const supabase = createClient()

  const title = (config.title as string) || '설문조사'
  const questions = (config.questions as Question[]) || []
  const allowMultiple = (config.allow_multiple as boolean) || false

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
      if (data) setAlreadySubmitted(true)
    }
    checkSubmission()
  }, [componentId, allowMultiple, supabase])

  const handleAnswer = (questionId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleCheckbox = (questionId: string, option: string, checked: boolean) => {
    const current = (answers[questionId] as string[]) || []
    if (checked) {
      handleAnswer(questionId, [...current, option])
    } else {
      handleAnswer(questionId, current.filter(v => v !== option))
    }
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
  }

  if (alreadySubmitted) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">✅</div>
        <p className="text-gray-600">이미 응답하셨습니다. 감사합니다!</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="p-4 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-gray-600">응답이 제출되었습니다. 감사합니다!</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>설문 문항이 없습니다. 관리자에서 문항을 추가해주세요.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="border rounded-lg p-4">
            <p className="font-medium mb-3">
              {idx + 1}. {q.label}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </p>

            {q.type === 'radio' && q.options && (
              <div className="space-y-2">
                {q.options.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      required={q.required}
                      onChange={() => handleAnswer(q.id, opt)}
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'checkbox' && q.options && (
              <div className="space-y-2">
                {q.options.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={e => handleCheckbox(q.id, opt, e.target.checked)}
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                rows={3}
                required={q.required}
                onChange={e => handleAnswer(q.id, e.target.value)}
              />
            )}

            {q.type === 'rating' && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleAnswer(q.id, n)}
                    className={`w-10 h-10 rounded-full border text-sm font-medium transition-colors ${
                      answers[q.id] === n ? 'bg-blue-600 text-white border-blue-600' : 'hover:border-blue-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
          제출하기
        </button>
      </form>
    </div>
  )
}

export function SurveyConfigForm({ config, onChange }: { config: Record<string, unknown>, onChange: (c: Record<string, unknown>) => void }) {
  const questions = (config.questions as Question[]) || []

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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">설문 제목</label>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          value={(config.title as string) || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allow_multiple"
          checked={(config.allow_multiple as boolean) || false}
          onChange={e => onChange({ ...config, allow_multiple: e.target.checked })}
        />
        <label htmlFor="allow_multiple" className="text-sm">중복 응답 허용</label>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">문항 ({questions.length}개)</span>
          <button onClick={addQuestion} className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            + 문항 추가
          </button>
        </div>
        {questions.map((q, idx) => (
          <div key={q.id} className="border rounded p-3 mb-2 text-sm">
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 border rounded px-2 py-1"
                placeholder="질문 내용"
                value={q.label}
                onChange={e => updateQuestion(idx, { label: e.target.value })}
              />
              <select
                className="border rounded px-2 py-1"
                value={q.type}
                onChange={e => updateQuestion(idx, { type: e.target.value as Question['type'] })}
              >
                <option value="radio">단일 선택</option>
                <option value="checkbox">다중 선택</option>
                <option value="text">텍스트</option>
                <option value="rating">별점 (1-5)</option>
              </select>
              <button onClick={() => removeQuestion(idx)} className="text-red-500 hover:text-red-700">✕</button>
            </div>
            {(q.type === 'radio' || q.type === 'checkbox') && (
              <textarea
                className="w-full border rounded px-2 py-1 text-xs"
                placeholder="옵션 (줄바꿈으로 구분)"
                value={(q.options || []).join('\n')}
                onChange={e => updateQuestion(idx, { options: e.target.value.split('\n').filter(Boolean) })}
                rows={3}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
