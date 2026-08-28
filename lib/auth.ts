import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

import { env } from "@/env.mjs"
import { db } from "@/lib/db"

const providers: any[] = []
const demoLoginEnabled =
  process.env.NODE_ENV !== "production" && env.ENABLE_DEMO_LOGIN !== "false"

if (demoLoginEnabled) {
  providers.push(
    CredentialsProvider({
      id: "credentials",
      name: "Local Test Account",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "demo@habitrunner.dev",
        },
        name: { label: "Name", type: "text", placeholder: "Demo User" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim() || "demo@habitrunner.dev"
        const name = credentials?.name?.trim() || "Demo Runner"

        try {
          // Upsert test user in database
          let user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            user = await db.user.create({
              data: {
                email,
                name,
                timezone: "Asia/Shanghai",
              },
            })
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }
        } catch (error) {
          console.error("Credentials login error", error)
          return null
        }
      },
    })
  )
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    })
  )
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin or trusted custom domains
      try {
        const parsedUrl = new URL(url)
        const parsedBase = new URL(baseUrl)
        if (
          parsedUrl.origin === parsedBase.origin ||
          parsedUrl.hostname.endsWith("dpdns.org") ||
          parsedUrl.hostname.endsWith("vercel.app")
        ) {
          return url
        }
      } catch {
        // ignore
      }
      return baseUrl
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        return token
      }

      const dbUser = await db.user.findFirst({
        where: {
          email: token.email,
        },
      })

      if (!dbUser) {
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      }
    },
  },
}
