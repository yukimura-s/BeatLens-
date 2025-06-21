"use client"

import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Settings, User } from "lucide-react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

export function Header() {
  const { data: session } = useSession()

  return (
    <div className="content-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div />
        
        {session?.user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px', 
                borderRadius: '8px', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                transition: 'background-color 0.3s ease'
              }}>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback style={{
                    background: 'var(--premium-gradient)',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}>
                    {session.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: 'var(--charcoal)' 
                  }}>
                    {session.user.name || "ユーザー"}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--dark-gray)' 
                  }}>
                    {session.user.email}
                  </div>
                </div>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                style={{
                  minWidth: '224px',
                  background: 'var(--pure-white)',
                  border: '1px solid var(--medium-gray)',
                  borderRadius: '12px',
                  padding: '8px',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)'
                }}
                sideOffset={8}
                align="end"
              >
                <DropdownMenu.Item style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: 'var(--dark-gray)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}>
                  <User style={{ width: '16px', height: '16px' }} />
                  プロフィール
                </DropdownMenu.Item>
                
                <DropdownMenu.Item style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: 'var(--dark-gray)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}>
                  <Settings style={{ width: '16px', height: '16px' }} />
                  設定
                </DropdownMenu.Item>
                
                <DropdownMenu.Separator style={{ 
                  height: '1px', 
                  background: 'var(--medium-gray)', 
                  margin: '8px 0' 
                }} />
                
                <DropdownMenu.Item 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: 'var(--neon-pink)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut style={{ width: '16px', height: '16px' }} />
                  ログアウト
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
    </div>
  )
}