"use client"

import * as React from "react"
import { signIn } from "next-auth/react"

import { cn } from "@/lib/utils"
import { getDictionary } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  demoEnabled?: boolean
  googleEnabled?: boolean
  githubEnabled?: boolean
}

export function UserAuthForm({
  className,
  demoEnabled = false,
  googleEnabled = false,
  githubEnabled = false,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [isDemoLoading, setIsDemoLoading] = React.useState<boolean>(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false)
  const [isGithubLoading, setIsGithubLoading] = React.useState<boolean>(false)

  // Auth pages are public entry environment -> strictly English
  const dict = getDictionary("en").auth.signIn

  return (
    <div className={cn("grid gap-3", className)} {...props}>
      {demoEnabled && (
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "default" }),
            "min-h-11 gap-2 bg-primary font-semibold text-primary-foreground shadow-md"
          )}
          onClick={() => {
            setIsDemoLoading(true)
            setIsLoading(true)
            signIn("credentials", {
              email: "demo@habitrunner.dev",
              name: "Demo Runner",
              callbackUrl: "/dashboard",
            })
          }}
          disabled={isLoading}
        >
          {isDemoLoading ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.habit className="h-4 w-4" />
          )}
          <span>{dict.demoLogin}</span>
        </button>
      )}

      {demoEnabled && (googleEnabled || githubEnabled) && (
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 font-medium text-muted-foreground">
              {dict.orThirdParty}
            </span>
          </div>
        </div>
      )}

      {googleEnabled && (
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
          onClick={() => {
            setIsGoogleLoading(true)
            setIsLoading(true)
            signIn("google", { callbackUrl: "/dashboard" })
          }}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}{" "}
          {dict.googleLogin}
        </button>
      )}

      {githubEnabled && (
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}
          onClick={() => {
            setIsGithubLoading(true)
            setIsLoading(true)
            signIn("github", { callbackUrl: "/dashboard" })
          }}
          disabled={isGithubLoading || isLoading}
        >
          {isGithubLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.github className="mr-2 h-4 w-4" />
          )}{" "}
          {dict.githubLogin}
        </button>
      )}

      {!demoEnabled && !googleEnabled && !githubEnabled && (
        <p
          role="alert"
          className="rounded-lg border border-dashed p-4 text-sm leading-relaxed text-muted-foreground"
        >
          {dict.notConfiguredAlert}
        </p>
      )}
    </div>
  )
}
