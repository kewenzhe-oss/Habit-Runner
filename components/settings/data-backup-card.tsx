"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export function DataBackupCard() {
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
        title: "数据导出成功",
        description: `已成功导出全部习惯与打卡历史数据文件。`,
      })
    } catch {
      toast({
        variant: "destructive",
        title: "导出失败",
        description: "获取备份数据时发生错误，请稍后重试。",
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
        title: "数据导入成功！",
        description: `已成功导入 ${result.itemsImported} 个习惯事项，${result.checkInsImported} 条打卡记录。`,
      })

      setTimeout(() => {
        window.location.reload()
      }, 1200)
    } catch {
      toast({
        variant: "destructive",
        title: "导入失败",
        description: "备份文件格式不正确或解析失败，请检查文件。",
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Icons.download className="h-4 w-4 text-primary" />
          数据备份与跨端迁移 (Data Backup & Migration)
        </CardTitle>
        <CardDescription className="text-xs">
          一键导出当前账号的所有习惯设定与打卡历史，或从备份文件导入到云端/生产环境。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || isImporting}
            className="gap-2"
          >
            {isExporting ? (
              <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icons.download className="h-3.5 w-3.5" />
            )}
            导出完整数据 (Export JSON)
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExporting || isImporting}
            className="gap-2"
          >
            {isImporting ? (
              <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icons.add className="h-3.5 w-3.5" />
            )}
            导入数据文件 (Import JSON)
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          💡 <span className="font-semibold text-foreground">跨环境迁移指南</span>：在本地环境导出 JSON 备份文件，然后打开 Vercel 线上网站的【系统设置】直接点击【导入数据文件】，即可瞬间将本地的所有习惯与历史打卡完整同步到云端！
        </p>
      </CardContent>
    </Card>
  )
}
