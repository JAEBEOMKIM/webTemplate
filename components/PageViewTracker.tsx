'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PageViewTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    const supabase = createClient()
    supabase.from('page_views').insert({ page_id: pageId }).then()
  }, [pageId])
  return null
}
