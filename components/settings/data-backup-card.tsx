"use client"

import * as React from "react"

import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

export function DataBackupCard() {
  const { dict, format } = useI18n()
  const copy = dict.item.settingsPage.backup
  const [isExporting, setIsExporting] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch("/api/data/export")
      if (!res.ok) throw new Error("导出失败")
      const data = await res.json()

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `habit-runner-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: copy.exportSuccess,
      })
    } catch {
      toast({
        variant: "destructive",
        title: copy.exportError,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const res = await fetch("/api/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      })

      if (!res.ok) throw new Error("导入失败")
      const result = await res.json()

      toast({
        title: copy.importSuccess,
        description: format(copy.importSummary, {
          items: result.itemsImported,
          checkIns: result.checkInsImported,
        }),
      })

      setTimeout(() => {
        window.location.reload()
      }, 1200)
    } catch {
      toast({
        variant: "destructive",
        title: copy.importError,
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card>
      <details className="group">
        <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-lg p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5 [&::-webkit-details-marker]:hidden">
          <Icons.download
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-semibold">{copy.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {copy.description}
            </p>
          </div>
          <Icons.down
            aria-hidden="true"
            className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="grid gap-3 border-t p-4 sm:grid-cols-2 sm:p-5">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || isImporting}
            className="min-h-11 gap-2"
          >
            {isExporting ? (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.download className="h-4 w-4" />
            )}
            {copy.export}
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExporting || isImporting}
            className="min-h-11 gap-2"
          >
            {isImporting ? (
              <Icons.spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.upload className="h-4 w-4" />
            )}
            {copy.import}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            aria-label={copy.import}
          />
        </div>
      </details>
    </Card>
  )
}
