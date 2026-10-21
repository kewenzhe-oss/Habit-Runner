"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { User } from "@prisma/client"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { userNameSchema } from "@/lib/validations/user"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

interface UserNameFormProps extends React.HTMLAttributes<HTMLFormElement> {
  user: Pick<User, "id" | "name">
}

type FormData = z.infer<typeof userNameSchema>

export function UserNameForm({ user, className, ...props }: UserNameFormProps) {
  const router = useRouter()
  const { dict } = useI18n()
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(userNameSchema),
    defaultValues: {
      name: user?.name || "",
    },
  })

  async function onSubmit(data: FormData) {
    const response = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
      }),
    })

    if (!response?.ok) {
      return toast({
        title: dict.common.notifications.updateFailed,
        description: dict.common.notifications.networkError,
        variant: "destructive",
      })
    }

    toast({
      description: dict.item.settingsPage.updateNameSuccess,
    })

    router.refresh()
  }

  return (
    <form
      className={cn(className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <Card>
        <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
          <h2 className="text-base font-semibold">
            {dict.item.settingsPage.displayNameTitle}
          </h2>
          <CardDescription className="text-sm">
            {dict.item.settingsPage.displayNameDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid min-w-0 gap-1">
            <Label className="sr-only" htmlFor="name">
              {dict.item.settingsPage.displayNameTitle}
            </Label>
            <Input
              id="name"
              className="w-full"
              placeholder={dict.item.settingsPage.displayNamePlaceholder}
              {...register("name")}
            />
            {errors?.name && (
              <p className="px-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <button
            type="submit"
            className={cn(
              buttonVariants({ size: "sm" }),
              "min-h-11 px-4",
              className
            )}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            <span>{dict.item.settingsPage.saveChangesButton}</span>
          </button>
        </CardContent>
      </Card>
    </form>
  )
}
