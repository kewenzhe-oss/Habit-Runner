import { Metadata } from "next"
import Link from "next/link"

import { env } from "@/env.mjs"
import { cn } from "@/lib/utils"
import { getDictionary } from "@/lib/i18n"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { UserAuthForm } from "@/components/user/user-auth-form"

const dict = getDictionary("en")

export const metadata: Metadata = {
  title: dict.auth.signUp.title,
  description: dict.auth.signUp.subtitle,
}

export default function Signup() {
  const dict = getDictionary("en")

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
          {dict.auth.signUp.backHome}
        </>
      </Link>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.auth.signUp.title}
          </h1>
          <p className="text-sm text-muted-foreground">{dict.auth.signUp.subtitle}</p>
        </div>
        <UserAuthForm
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
          {dict.auth.signUp.alreadyHaveAccountPrompt}{" "}
          <Link
            href="/signin"
            className="hover:text-brand underline underline-offset-4"
          >
            {dict.auth.signUp.signInLink}
          </Link>
        </p>
      </div>
    </main>
  )
}
