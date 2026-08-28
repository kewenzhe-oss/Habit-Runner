"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { buildSignInUrl } from "@/lib/auth-redirect"
import { useI18n } from "@/lib/i18n"
import {
  clearPendingNewItem,
  PendingNewItemPayload,
  readPendingNewItem,
} from "@/lib/pending-new-item"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

import { ItemForm } from "./item-form"

interface RestorableNewItemFormProps {
  restore: boolean
}

type DraftState = PendingNewItemPayload | null | undefined

function removeRestoreQuery() {
  window.history.replaceState(null, "", "/items/new")
}

export function RestorableNewItemForm({ restore }: RestorableNewItemFormProps) {
  const router = useRouter()
  const { dict } = useI18n()
  const [draft, setDraft] = React.useState<DraftState>(
    restore ? undefined : null
  )
  const didRestore = React.useRef(false)

  React.useEffect(() => {
    if (!restore || didRestore.current) return
    didRestore.current = true

    const restoreDraft = async () => {
      const pending = readPendingNewItem()

      if (pending.status !== "valid") {
        setDraft(null)
        removeRestoreQuery()
        toast({
          title:
            pending.status === "expired"
              ? dict.form.pending.expiredTitle
              : pending.status === "invalid"
                ? dict.form.pending.invalidTitle
                : dict.form.pending.missingTitle,
          description:
            pending.status === "expired"
              ? dict.form.pending.expiredDescription
              : pending.status === "invalid"
                ? dict.form.pending.invalidDescription
                : dict.form.pending.missingDescription,
        })
        return
      }

      const payload = pending.value.payload

      try {
        const response = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (response.status === 401) {
          router.replace(buildSignInUrl("/items/new?restore=1"))
          return
        }

        if (!response.ok) {
          const issues = response.status === 422 ? await response.json() : null
          const issueText = Array.isArray(issues)
            ? issues
                .slice(0, 3)
                .map((issue) => issue.message)
                .join(" · ")
            : undefined

          setDraft(payload)
          removeRestoreQuery()
          toast({
            title: dict.form.pending.needsAttentionTitle,
            description:
              issueText || dict.form.pending.needsAttentionDescription,
            variant: "destructive",
          })
          return
        }

        clearPendingNewItem()
        toast({
          title: dict.form.pending.savedTitle,
          description: dict.form.pending.savedDescription.replace(
            "{title}",
            payload.title
          ),
        })
        router.replace("/dashboard")
        router.refresh()
      } catch {
        setDraft(payload)
        removeRestoreQuery()
        toast({
          title: dict.form.pending.retryTitle,
          description: dict.form.pending.retryDescription,
        })
      }
    }

    void restoreDraft()
  }, [dict.form.pending, restore, router])

  if (draft === undefined) {
    return (
      <Card role="status" aria-live="polite">
        <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
          <Icons.spinner className="h-6 w-6 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {dict.form.pending.restoringTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {dict.form.pending.restoringDescription}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <ItemForm mode="create" initialDraft={draft || undefined} />
}
