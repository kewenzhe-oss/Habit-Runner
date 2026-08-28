"use client"

import * as React from "react"

import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

interface Category {
  id: string
  name: string
  colorCode?: string | null
}

interface CategoryManagerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onRefresh: () => void
}

const COLOR_PALETTE = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#64748B", // Slate
]

export function CategoryManagerModal({
  open,
  onOpenChange,
  categories,
  onRefresh,
}: CategoryManagerModalProps) {
  const { dict, format } = useI18n()
  const [newCatName, setNewCatName] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState("#10B981")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          colorCode: selectedColor,
        }),
      })

      if (!res.ok) throw new Error(dict.common.notifications.saveFailed)

      toast({
        title: dict.dashboard.categories.createSuccess,
        description: format(dict.dashboard.categories.createDesc, { name: newCatName.trim() }),
      })
      setNewCatName("")
      onRefresh()
    } catch (err: any) {
      toast({
        title: dict.common.notifications.saveFailed,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (!res.ok) throw new Error(dict.common.notifications.updateFailed)

      toast({ title: dict.dashboard.categories.renameSuccess })
      setEditingId(null)
      onRefresh()
    } catch (err: any) {
      toast({
        title: dict.common.notifications.updateFailed,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        format(dict.dashboard.categories.deleteConfirmPrompt, { name })
      )
    )
      return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error(dict.common.notifications.deleteFailed)

      toast({ title: dict.dashboard.categories.deleteSuccess })
      onRefresh()
    } catch (err: any) {
      toast({
        title: dict.common.notifications.deleteFailed,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{dict.dashboard.categories.modalTitle}</DialogTitle>
          <DialogDescription>
            {dict.dashboard.categories.modalDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* New Category Input */}
          <form onSubmit={handleCreate} className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder={dict.dashboard.categories.addPlaceholder}
                className="text-xs"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !newCatName.trim()}
              >
                {dict.dashboard.categories.addButton}
              </Button>
            </div>

            {/* Color circles */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground">
                {dict.dashboard.categories.colorLabel}
              </span>
              <div className="flex gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    aria-pressed={selectedColor === c}
                    onClick={() => setSelectedColor(c)}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{
                      background: `radial-gradient(circle, ${c} 0 36%, transparent 38%)`,
                      outline:
                        selectedColor === c ? "2px solid currentColor" : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2 border-t pt-3">
            <label className="text-xs font-semibold text-muted-foreground">
              {dict.dashboard.categories.existingTitle} ({categories.length})
            </label>
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-2 text-xs"
                >
                  {editingId === cat.id ? (
                    <div className="mr-2 flex flex-1 items-center gap-1.5">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-7 text-xs"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleUpdate(cat.id)}
                      >
                        {dict.common.actions.save}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditingId(null)}
                      >
                        {dict.common.actions.cancel}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.colorCode || "#8B5CF6" }}
                      />
                      <span className="font-medium text-foreground">
                        {cat.name}
                      </span>
                    </div>
                  )}

                  {editingId !== cat.id && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={format(dict.dashboard.categories.renameAria, { name: cat.name })}
                        onClick={() => {
                          setEditingId(cat.id)
                          setEditName(cat.name)
                        }}
                        className="min-h-11 rounded-md px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        {dict.common.actions.rename}
                      </button>
                      <button
                        type="button"
                        aria-label={format(dict.dashboard.categories.deleteAria, { name: cat.name })}
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="min-h-11 rounded-md px-3 text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700"
                      >
                        {dict.common.actions.delete}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {dict.dashboard.categories.doneButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
