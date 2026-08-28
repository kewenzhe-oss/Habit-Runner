"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTheme } from "next-themes"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark"], {
    required_error: "请选择一个主题外观。",
  }),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

export function AppearanceForm() {
  const { theme, setTheme } = useTheme()
  const { dict } = useI18n()
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
  })

  function onSubmit(data: AppearanceFormValues) {
    setTheme(data.theme)
    toast({
      description: dict.item.settingsPage.updateThemeSuccess,
    })
  }

  useEffect(() => {
    // sync current theme with form state
    form.setValue("theme", theme as "light" | "dark")
  }, [theme, form])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {dict.item.settingsPage.appearanceTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">
                    {dict.item.settingsPage.themeLabel}
                  </FormLabel>
                  <FormDescription className="text-xs">
                    {dict.item.settingsPage.themeDesc}
                  </FormDescription>
                  <FormMessage />
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid max-w-md grid-cols-1 pt-2 md:grid-cols-2 md:gap-4"
                  >
                    <FormItem>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                        <FormControl>
                          <RadioGroupItem value="light" className="sr-only" />
                        </FormControl>
                        <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                          <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                            <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                              <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                              <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                              <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                            </div>
                          </div>
                        </div>
                        <span className="block w-full p-2 text-center text-xs font-normal">
                          {dict.common.theme.light}
                        </span>
                      </FormLabel>
                    </FormItem>
                    <FormItem>
                      <FormLabel className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                        <FormControl>
                          <RadioGroupItem value="dark" className="sr-only" />
                        </FormControl>
                        <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                          <div className="space-y-2 rounded-sm bg-zinc-950 p-2">
                            <div className="space-y-2 rounded-md bg-zinc-800 p-2 shadow-sm">
                              <div className="h-2 w-[80px] rounded-lg bg-zinc-400" />
                              <div className="h-2 w-[100px] rounded-lg bg-zinc-400" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-zinc-800 p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-zinc-400" />
                              <div className="h-2 w-[100px] rounded-lg bg-zinc-400" />
                            </div>
                          </div>
                        </div>
                        <span className="block w-full p-2 text-center text-xs font-normal">
                          {dict.common.theme.dark}
                        </span>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormItem>
              )}
            />

            <Button type="submit" size="sm">
              {dict.item.settingsPage.updateAppearanceButton}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
