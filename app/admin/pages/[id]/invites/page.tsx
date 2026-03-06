'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface InviteCode {
  id: string
  code: string
  max_uses: number
  used_count: number
  expires_at: string | null
  created_at: string
}

interface AccessGrant {
  id: string
  granted_at: string
  user_email?: string
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function InvitesPage() {
  const params = useParams()
  const pageId = params.id as string
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [grants, setGrants] = useState<AccessGrant[]>([])
  const [form, setForm] = useState({ code: generateCode(), max_uses: 1, expires_at: '' })
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [{ data: c }, { data: g }] = await Promise.all([
      supabase.from('invite_codes').select('*').eq('page_id', pageId).order('created_at', { ascending: false }),
      supabase.from('page_access_grants').select('id, granted_at, user_id').eq('page_id', pageId),
    ])
    setCodes(c || [])
    setGrants(g || [])
  }, [pageId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('invite_codes').insert({
      page_id: pageId,
      code: form.code.toUpperCase(),
      max_uses: form.max_uses,
      expires_at: form.expires_at || null,
      created_by: user?.id,
    })
    setForm({ code: generateCode(), max_uses: 1, expires_at: '' })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('invite_codes').delete().eq('id', id)
    fetchData()
  }

  const handleRevokeAccess = async (grantId: string) => {
    await supabase.from('page_access_grants').delete().eq('id', grantId)
    fetchData()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">초대코드 관리</h1>

      {/* 코드 생성 */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4">새 초대코드 생성</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">코드</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 font-mono uppercase"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
              />
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, code: generateCode() }))}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                🔄
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">최대 사용 횟수</label>
            <input
              type="number"
              min="1"
              className="w-full border rounded-lg px-3 py-2"
              value={form.max_uses}
              onChange={e => setForm(f => ({ ...f, max_uses: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">만료일 (선택)</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2"
              value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            코드 생성
          </button>
        </form>
      </div>

      {/* 코드 목록 */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4">초대코드 목록 ({codes.length}개)</h2>
        {codes.length === 0 ? (
          <p className="text-gray-500 text-sm">초대코드가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {codes.map(code => (
              <div key={code.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-mono font-bold">{code.code}</div>
                  <div className="text-xs text-gray-500">
                    사용: {code.used_count}/{code.max_uses}
                    {code.expires_at && ` · 만료: ${new Date(code.expires_at).toLocaleDateString('ko-KR')}`}
                    {code.used_count >= code.max_uses && <span className="text-red-500 ml-2">소진됨</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(code.id)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 접근 허용 사용자 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">접근 허용 사용자 ({grants.length}명)</h2>
        {grants.length === 0 ? (
          <p className="text-gray-500 text-sm">접근이 허용된 사용자가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {grants.map(grant => (
              <div key={grant.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="text-sm font-medium">{grant.user_email || grant.id}</div>
                  <div className="text-xs text-gray-500">
                    허용일: {new Date(grant.granted_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeAccess(grant.id)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  접근 취소
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
