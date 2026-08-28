"use client"

import * as React from "react"
import Link from "next/link"
import { CompletedTodoSummary } from "@/lib/api/history"
import { useI18n, formatLocalizedDate } from "@/lib/i18n"
import { Icons } from "@/components/icons"

interface CompletedTodosCardProps {
  completedTodos: CompletedTodoSummary[]
}

export function CompletedTodosCard({
  completedTodos,
}: CompletedTodosCardProps) {
  const { dict, locale, format } = useI18n()
  const todoDict = dict.insights.activityHistory.completedTodos

  if (completedTodos.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icons.check className="h-4 w-4 text-muted-foreground/50" />
        <h2 className="text-sm font-semibold text-foreground">{todoDict.title}</h2>
      </div>

      <div className="divide-y divide-border/40 rounded-xl border border-border/50 bg-card">
        {completedTodos.map((todo) => (
          <Link
            key={todo.id}
            href={`/items/${todo.id}`}
            className="group flex flex-col justify-between gap-2 px-4 py-3 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Icons.check className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              <span className="truncate text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/30 transition-colors group-hover:text-foreground">
                {todo.title}
              </span>
              {todo.customCategory && (
                <span className="text-[10px] text-muted-foreground/60">
                  {todo.customCategory}
                </span>
              )}
            </div>

            {todo.completedDate && (
              <div className="shrink-0 text-[11px] text-muted-foreground/60">
                {format(todoDict.completedOn, {
                  date: formatLocalizedDate(todo.completedDate, locale),
                })}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
