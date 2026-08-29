import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { toCanonicalUrl } from "@/lib/seo"

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
  return toCanonicalUrl(path)
}
