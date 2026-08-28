import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
  const date = input instanceof Date ? input : new Date(input)
  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  })
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${base}${path}`
}
