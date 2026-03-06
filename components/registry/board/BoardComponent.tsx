'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ComponentProps } from '../types'

interface Post {
  id: string
  title: string
  content: string | null
  author_name: string | null
  created_at: string
}

export function BoardComponent({ componentId, config }: ComponentProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', author_name: '' })
  const supabase = createClient()

  const title = (config.title as string) || '게시판'

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('board_posts')
      .select('id, title, content, author_name, created_at')
      .eq('component_id', componentId)
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }, [componentId, supabase])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('board_posts').insert({
      component_id: componentId,
      title: form.title,
      content: form.content,
      author_name: form.author_name || user?.email || '익명',
      author_id: user?.id || null,
    })
    setForm({ title: '', content: '', author_name: '' })
    setShowForm(false)
    fetchPosts()
  }

  if (loading) return <div className="p-4 text-gray-500">로딩 중...</div>

  if (selectedPost) {
    return (
      <div className="p-4">
        <button onClick={() => setSelectedPost(null)} className="mb-4 text-blue-600 hover:underline text-sm">
          ← 목록으로
        </button>
        <h2 className="text-xl font-bold mb-2">{selectedPost.title}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {selectedPost.author_name} · {new Date(selectedPost.created_at).toLocaleDateString('ko-KR')}
        </p>
        <div className="prose max-w-none whitespace-pre-wrap">{selectedPost.content}</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          글쓰기
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <input
            className="w-full border rounded px-3 py-2 mb-2 text-sm"
            placeholder="이름 (선택)"
            value={form.author_name}
            onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
          />
          <input
            className="w-full border rounded px-3 py-2 mb-2 text-sm"
            placeholder="제목 *"
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="w-full border rounded px-3 py-2 mb-2 text-sm h-32"
            placeholder="내용"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              등록
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded text-sm">
              취소
            </button>
          </div>
        </form>
      )}

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">게시글이 없습니다.</p>
      ) : (
        <ul className="divide-y">
          {posts.map(post => (
            <li
              key={post.id}
              className="py-3 cursor-pointer hover:bg-gray-50 px-2 rounded"
              onClick={() => setSelectedPost(post)}
            >
              <div className="font-medium">{post.title}</div>
              <div className="text-sm text-gray-500">
                {post.author_name} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function BoardConfigForm({ config, onChange }: { config: Record<string, unknown>, onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">게시판 제목</label>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          value={(config.title as string) || ''}
          onChange={e => onChange({ ...config, title: e.target.value })}
        />
      </div>
    </div>
  )
}
