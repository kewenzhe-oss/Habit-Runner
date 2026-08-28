"use client"

import * as React from "react"
import { signIn } from "next-auth/react"

import { getDictionary } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string
  demoEnabled?: boolean
  googleEnabled?: boolean
  githubEnabled?: boolean
}

export function UserAuthForm({
  className,
  callbackUrl = "/dashboard",
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

  const [demoEmail, setDemoEmail] = React.useState("dwsun396@gmail.com")

  return (
    <div className={cn("grid gap-3", className)} {...props}>
      {demoEnabled && (
        <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Icons.habit className="h-3.5 w-3.5" />
            <span>本地快速登录 (Local Dev Login)</span>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              placeholder="dwsun396@gmail.com"
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "default" }),
                "h-auto px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs"
              )}
              onClick={() => {
                setIsDemoLoading(true)
                setIsLoading(true)
                signIn("credentials", {
                  email: demoEmail.trim() || "dwsun396@gmail.com",
                  name: (demoEmail.split("@")[0] || "Demo Runner"),
                  callbackUrl,
                })
              }}
              disabled={isLoading}
            >
              {isDemoLoading ? (
                <Icons.spinner className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "一键登录"
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            本地开发免密模式：可直接以 <span className="font-mono text-foreground font-medium">dwsun396@gmail.com</span> 身份进入
          </p>
        </div>
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
            signIn("google", { callbackUrl })
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
            signIn("github", { callbackUrl })
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
