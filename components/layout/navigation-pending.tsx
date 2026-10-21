"use client"

import { useLinkStatus } from "next/link"

import { Icons } from "@/components/icons"

export function NavigationPending({
  children,
}: {
  children?: React.ReactNode
}) {
  const { pending } = useLinkStatus()
  return pending ? (
    <Icons.spinner aria-hidden="true" className="h-5 w-5 animate-spin" />
  ) : (
    children ?? null
  )
}
