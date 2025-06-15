"use client"

import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Avatar from "@radix-ui/react-avatar"
import { LogOut, User } from "lucide-react"

export function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar.Root className="h-8 w-8">
            <Avatar.Image
              src={session.user.image || ""}
              alt={session.user.name || ""}
              className="rounded-full"
            />
            <Avatar.Fallback className="rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4" />
            </Avatar.Fallback>
          </Avatar.Root>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="w-56 bg-popover border rounded-md shadow-md" align="end">
        <DropdownMenu.Label className="font-normal px-2 py-1.5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator className="h-px bg-border mx-1" />
        <DropdownMenu.Item
          className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
          onSelect={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}