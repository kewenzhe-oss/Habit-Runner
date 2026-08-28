import { Metadata } from "next"
import Link from "next/link"

import { env } from "@/env.mjs"
import { buildSignUpUrl, resolvePostSignInPath } from "@/lib/auth-redirect"
import { getDictionary } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { UserAuthForm } from "@/components/user/user-auth-form"

const dict = getDictionary("en")

export const metadata: Metadata = {
  title: dict.auth.signIn.title,
  description: dict.auth.signIn.subtitle,
}

interface SigninProps {
  searchParams?: Promise<{
    redirect?: string
    restore?: string
  }>
}

export default async function Signin({ searchParams }: SigninProps) {
  const dict = getDictionary("en")
  const params = searchParams ? await searchParams : {}
  const callbackUrl = resolvePostSignInPath(params)

  return (
    <main className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 md:left-8 md:top-8"
        )}
      >
        <>
          <Icons.back className="mr-2 h-4 w-4" />
          {dict.auth.signIn.backHome}
        </>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.auth.signIn.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dict.auth.signIn.subtitle}
          </p>
        </div>
        <UserAuthForm
          callbackUrl={callbackUrl}
          demoEnabled={
            process.env.NODE_ENV !== "production" &&
            env.ENABLE_DEMO_LOGIN !== "false"
          }
          googleEnabled={Boolean(
            env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
          )}
          githubEnabled={Boolean(
            env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
          )}
        />
        <p className="px-8 text-center text-sm text-muted-foreground">
          {dict.auth.signIn.noAccountPrompt}{" "}
          <Link
            href={buildSignUpUrl(callbackUrl)}
            className="hover:text-brand underline underline-offset-4"
          >
            {dict.auth.signIn.createAccountLink}
          </Link>
        </p>
      </div>
    </main>
  )
}
