import { cookies } from "next/headers"
import { getCurrentUser } from "@/lib/session"
import { I18nProvider, Locale } from "@/lib/i18n"
import Footer from "@/components/layout/footer"
import Navbar from "@/components/layout/navbar"

interface AppLayoutProps {
  children: React.ReactNode
}

export async function AppLayout({ children }: AppLayoutProps) {
  const user = await getCurrentUser()
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("habit_runner_locale")?.value
  const initialLocale: Locale =
    cookieLocale === "zh" || cookieLocale === "en" ? cookieLocale : "zh"

  return (
    <I18nProvider initialLocale={initialLocale}>
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar
          user={{
            name: user?.name,
            image: user?.image,
            email: user?.email,
          }}
        />
        <main
          id="main-content"
          className="container max-w-4xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-8"
        >
          {children}
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
    </I18nProvider>
  )
}
