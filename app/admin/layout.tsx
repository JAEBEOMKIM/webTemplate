import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import AdminSignOut from './AdminSignOut'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 미인증 → 로그인 페이지
  if (!user) {
    redirect('/auth/login?redirect=/admin')
  }

  // 관리자 이메일 체크 (ADMIN_EMAIL 설정 시)
  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || ''
  if (adminEmail && user.email !== adminEmail) {
    // 비관리자 → 전용 권한없음 페이지 (로그인 페이지로 보내면 redirect loop 발생)
    redirect(`/unauthorized?email=${encodeURIComponent(user.email ?? '')}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Sidebar - desktop */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '240px',
        background: 'var(--bg-primary)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 20,
      }} className="admin-sidebar">
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3.5" fill="white"/>
                <path d="M12 3v3M12 18v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M3 12h3M18 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>PageBuilder</span>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 10px', marginBottom: '8px' }}>메뉴</p>
          <NavItem href="/admin" label="대시보드" icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.07926 0.222253C7.31275 -0.007434 7.6873 -0.007434 7.92079 0.222253L14.6708 6.86227C14.907 7.09465 14.9101 7.47453 14.6778 7.71076C14.4454 7.947 14.0655 7.95012 13.8293 7.71773L13 6.90201V12.5C13 12.7761 12.7762 13 12.5 13H2.50002C2.22388 13 2.00002 12.7761 2.00002 12.5V6.90201L1.17079 7.71773C0.934558 7.95012 0.554672 7.947 0.32229 7.71076C0.0899079 7.47453 0.0930283 7.09465 0.32926 6.86227L7.07926 0.222253ZM7.50002 1.49163L12 5.91831V12H10V8.49999C10 8.22385 9.77617 7.99999 9.50002 7.99999H6.50002C6.22388 7.99999 6.00002 8.22385 6.00002 8.49999V12H3.00002V5.91831L7.50002 1.49163ZM7.00002 12H9.00002V8.99999H7.00002V12Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
          } />
          <NavItem href="/admin/pages" label="페이지 관리" icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 2.5C3 2.22386 3.22386 2 3.5 2H9.08579C9.21839 2 9.34557 2.05268 9.43934 2.14645L11.8536 4.56066C11.9473 4.65443 12 4.78161 12 4.91421V12.5C12 12.7761 11.7761 13 11.5 13H3.5C3.22386 13 3 12.7761 3 12.5V2.5ZM3.5 1C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V4.91421C13 4.51639 12.842 4.13486 12.5607 3.85355L10.1464 1.43934C9.86514 1.15804 9.48361 1 9.08579 1H3.5ZM4.5 4C4.22386 4 4 4.22386 4 4.5C4 4.77614 4.22386 5 4.5 5H7.5C7.77614 5 8 4.77614 8 4.5C8 4.22386 7.77614 4 7.5 4H4.5ZM4.5 7C4.22386 7 4 7.22386 4 7.5C4 7.77614 4.22386 8 4.5 8H10.5C10.7761 8 11 7.77614 11 7.5C11 7.22386 10.7761 7 10.5 7H4.5ZM4.5 10C4.22386 10 4 10.2239 4 10.5C4 10.7761 4.22386 11 4.5 11H10.5C10.7761 11 11 10.7761 11 10.5C11 10.2239 10.7761 10 10.5 10H4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
          } />
          <NavItem href="/admin/themes" label="테마 관리" icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 0.877075C3.84378 0.877075 0.877075 3.84378 0.877075 7.5C0.877075 11.1562 3.84378 14.1229 7.5 14.1229C11.1562 14.1229 14.1229 11.1562 14.1229 7.5C14.1229 3.84378 11.1562 0.877075 7.5 0.877075ZM1.82708 7.5C1.82708 4.36848 4.36848 1.82708 7.5 1.82708C10.6315 1.82708 13.1729 4.36848 13.1729 7.5C13.1729 10.6315 10.6315 13.1729 7.5 13.1729C4.36848 13.1729 1.82708 10.6315 1.82708 7.5ZM7.5 4.50001C7.5 5.88072 6.38072 7.00001 5 7.00001C3.61929 7.00001 2.5 5.88072 2.5 4.50001C5 4.50001 7.5 4.50001 7.5 4.50001ZM7.5 4.50001C7.5 5.88072 8.61929 7.00001 10 7.00001C11.3807 7.00001 12.5 5.88072 12.5 4.50001C10 4.50001 7.5 4.50001 7.5 4.50001ZM4 10C4 8.61929 5.11929 7.50001 6.5 7.50001H8.5C9.88071 7.50001 11 8.61929 11 10C11 11.3807 9.88071 12.5 8.5 12.5H6.5C5.11929 12.5 4 11.3807 4 10Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
          } />
          <NavItem href="/admin/components" label="컴포넌트" icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M4.5 1C4.22386 1 4 1.22386 4 1.5C4 1.77614 4.22386 2 4.5 2H5V4H2.5C2.22386 4 2 4.22386 2 4.5V7H1.5C1.22386 7 1 7.22386 1 7.5C1 7.77614 1.22386 8 1.5 8H2V10.5C2 10.7761 2.22386 11 2.5 11H5V13H4.5C4.22386 13 4 13.2239 4 13.5C4 13.7761 4.22386 14 4.5 14H10.5C10.7761 14 11 13.7761 11 13.5C11 13.2239 10.7761 13 10.5 13H10V11H12.5C12.7761 11 13 10.7761 13 10.5V8H13.5C13.7761 8 14 7.77614 14 7.5C14 7.22386 13.7761 7 13.5 7H13V4.5C13 4.22386 12.7761 4 12.5 4H10V2H10.5C10.7761 2 11 1.77614 11 1.5C11 1.22386 10.7761 1 10.5 1H4.5ZM9 2H6V4H9V2ZM12 5H3V10H12V5ZM9 11H6V13H9V11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
          } />
          <NavItem href="/admin/component-groups" label="그룹 관리" icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M0.5 1C0.223858 1 0 1.22386 0 1.5V6.5C0 6.77614 0.223858 7 0.5 7H2V8H0.5C0.223858 8 0 8.22386 0 8.5V13.5C0 13.7761 0.223858 14 0.5 14H6.5C6.77614 14 7 13.7761 7 13.5V8.5C7 8.22386 6.77614 8 6.5 8H5V7H6.5C6.77614 7 7 6.77614 7 6.5V5H8V6.5C8 6.77614 8.22386 7 8.5 7H14.5C14.7761 7 15 6.77614 15 6.5V1.5C15 1.22386 14.7761 1 14.5 1H8.5C8.22386 1 8 1.22386 8 1.5V4H7V1.5C7 1.22386 6.77614 1 6.5 1H0.5ZM6 2H1V6H6V2ZM9 2H14V6H9V2ZM3 7H4V8H3V7ZM1 9H6V13H1V9Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
          } />
          <NavItem href="/admin/images" label="이미지 관리" icon={
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 3.5C2 3.22386 2.22386 3 2.5 3H12.5C12.7761 3 13 3.22386 13 3.5V11.5C13 11.7761 12.7761 12 12.5 12H2.5C2.22386 12 2 11.7761 2 11.5V3.5ZM2.5 2C1.67157 2 1 2.67157 1 3.5V11.5C1 12.3284 1.67157 13 2.5 13H12.5C13.3284 13 14 12.3284 14 11.5V3.5C14 2.67157 13.3284 2 12.5 2H2.5ZM5 6C5 6.55228 4.55228 7 4 7C3.44772 7 3 6.55228 3 6C3 5.44772 3.44772 5 4 5C4.55228 5 5 5.44772 5 6ZM12 10.5L9 7L6 10.5L4.5 9L3 10.5V11H12V10.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
          } />
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="nav-item">
              <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
              사이트 보기
            </div>
          </Link>
          {user && (
            <div style={{ padding: '8px 12px', marginTop: '4px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          )}
          <div style={{ padding: '8px 12px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>테마</span>
            <ThemeToggle />
          </div>
          <div style={{ marginTop: '8px' }}>
            <AdminSignOut />
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px' }} className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3.5" fill="white"/>
              <path d="M12 3v3M12 18v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M3 12h3M18 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>PageBuilder</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Link href="/admin/pages" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 12px' }}>페이지</button>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 0, padding: '32px 20px' }} className="admin-content">
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .admin-sidebar { display: flex !important; }
          .admin-mobile-header { display: none !important; }
          .admin-content { margin-left: 240px !important; }
        }
        @media (max-width: 767px) {
          .admin-sidebar { display: none !important; }
          .admin-mobile-header { display: flex !important; }
          .admin-content { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  )
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="nav-item">
        {icon}
        {label}
      </div>
    </Link>
  )
}
