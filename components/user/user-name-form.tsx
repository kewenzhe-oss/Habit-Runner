"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { User } from "@prisma/client"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { userNameSchema } from "@/lib/validations/user"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {dict.item.settingsPage.displayNameTitle}
          </CardTitle>
          <CardDescription className="text-xs">
            {dict.item.settingsPage.displayNameDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="name">
              {dict.item.settingsPage.displayNameTitle}
            </Label>
            <Input
              id="name"
              className="w-full text-xs lg:w-[400px]"
              placeholder={dict.item.settingsPage.displayNamePlaceholder}
              size={32}
              {...register("name")}
            />
            {errors?.name && (
              <p className="px-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <button
            type="submit"
            className={cn(buttonVariants({ size: "sm" }), className)}
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            <span>{dict.item.settingsPage.saveChangesButton}</span>
          </button>
        </CardFooter>
      </Card>
    </form>
  )
}
