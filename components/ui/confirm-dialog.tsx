"use client"

import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"

export interface ConfirmOptions {
  cancelLabel?: string
  confirmLabel?: string
  description?: React.ReactNode
  destructive?: boolean
  title: string
}

/**
 * Promise-based replacement for `window.confirm`.
 *
 * const [confirm, confirmDialog] = useConfirm()
 * if (!(await confirm({ title: "Delete?" }))) return
 * ...render {confirmDialog} somewhere in the component tree.
 */
export function useConfirm() {
  const [open, setOpen] = React.useState(false)
  // Options are kept after closing so the text stays visible during the exit animation.
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null)
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback((next: ConfirmOptions) => {
    resolverRef.current?.(false)
    setOptions(next)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settle = React.useCallback((value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOpen(false)
  }, [])

  const confirmDialog = (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) {
          settle(false)
        }
      }}
      open={open}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description ? (
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{options?.cancelLabel ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction
            className={
              options?.destructive
                ? buttonVariants({ variant: "destructive" })
                : undefined
            }
            onClick={() => settle(true)}
          >
            {options?.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return [confirm, confirmDialog] as const
}
