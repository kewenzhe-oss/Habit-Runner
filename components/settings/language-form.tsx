"use client"

import * as React from "react"
import { Locale, useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

export function LanguageForm() {
  const { locale, setLocale, dict } = useI18n()
  const [selected, setSelected] = React.useState<Locale>(locale)

  React.useEffect(() => {
    setSelected(locale)
  }, [locale])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setLocale(selected)
    toast({
      description: dict.item.settingsPage.updateLanguageSuccess,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.globe className="h-5 w-5 text-primary" />
          <span>{dict.item.settingsPage.languageTitle}</span>
        </CardTitle>
        <CardDescription>
          {dict.item.settingsPage.languageDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <RadioGroup
            value={selected}
            onValueChange={(val) => {
              const nextLocale = val as Locale
              setSelected(nextLocale)
              setLocale(nextLocale)
              toast({
                description:
                  nextLocale === "zh"
                    ? "界面语言已更新为 简体中文"
                    : "Display language updated to English",
              })
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <RadioGroupItem
                value="zh"
                id="locale-zh"
                className="peer sr-only"
              />
              <Label
                htmlFor="locale-zh"
                className="flex cursor-pointer flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold">
                    {dict.item.settingsPage.langZh}
                  </span>
                  {selected === "zh" && (
                    <Icons.check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  默认中文操作环境，贴合中文习惯
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="en"
                id="locale-en"
                className="peer sr-only"
              />
              <Label
                htmlFor="locale-en"
                className="flex cursor-pointer flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold">
                    {dict.item.settingsPage.langEn}
                  </span>
                  {selected === "en" && (
                    <Icons.check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="mt-1 text-xs text-muted-foreground">
                  Full English operation environment
                </span>
              </Label>
            </div>
          </RadioGroup>
        </form>
      </CardContent>
    </Card>
  )
}
