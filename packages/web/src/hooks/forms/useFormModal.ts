import React from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import type { FieldValues, Path } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { unsuccessfulResponse } from '../../lib/responses'
import {
    generateDefaultValues,
    type FormBaseHandleSubmit,
    type FormBaseHandleSubmitReturn,
    type FormBaseProps,
    type FormBaseReturn,
    type FormBaseSchema,
} from './forms'
import { useNavigate } from '@tanstack/react-router'

type UseFormModalHandleSubmitReturn<TIn extends FieldValues> =
    FormBaseHandleSubmitReturn<TIn>

type UseFormModalReturn<
    TSchema extends FormBaseSchema,
    THandleSubmit,
> = FormBaseReturn<TSchema, THandleSubmit> & {
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

type UseFormModalProps<TSchema extends FormBaseSchema> =
    FormBaseProps<TSchema> & {
        open?: boolean
        onOpenChange?: (open: boolean) => void
    }

export const useFormModal = <TSchema extends FormBaseSchema>({
    formSchema,
    defaultValues,
    onOpenChange,
    open: controlledOpen,
    ...props
}: UseFormModalProps<TSchema>): UseFormModalReturn<
    TSchema,
    FormBaseHandleSubmit<
        z.input<TSchema>,
        z.output<TSchema>,
        UseFormModalHandleSubmitReturn<z.input<TSchema>>
    >
> => {
    type TIn = z.input<TSchema>
    type TOut = z.output<TSchema>

    const navigate = useNavigate()
    const form = useForm<TIn, any, TOut>({
        resolver: standardSchemaResolver(formSchema),
        defaultValues: generateDefaultValues<TIn>(formSchema, defaultValues),
        ...(props as any),
    })

    // Maintain state for modal open/close
    // Internal state for uncontrolled mode
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState<boolean>(
        controlledOpen ?? false,
    )

    // Determine if controlled or uncontrolled
    const open =
        typeof controlledOpen !== 'undefined'
            ? controlledOpen
            : uncontrolledOpen

    const setOpen = React.useCallback(
        (value: boolean | ((prev: boolean) => boolean)) => {
            const next = typeof value === 'function' ? value(open) : value
            if (onOpenChange) {
                onOpenChange(next)
            }

            if (typeof controlledOpen === 'undefined') {
                setUncontrolledOpen(next)
            }
        },
        [controlledOpen, onOpenChange],
    )

    const handleSubmit: FormBaseHandleSubmit<
        TIn,
        TOut,
        UseFormModalHandleSubmitReturn<TIn>
    > = fn => {
        return form.handleSubmit(async data => {
            const res = await fn(data, {
                unsuccessfulResponse,
            })
            if (!res) {
                setOpen(false)
                return
            }

            if (!res.type || res.type === 'success') {
                setOpen(false)
                if (res.message) {
                    toast.success(res.message)
                }

                if (res.redirect) {
                    return navigate(res.redirect)
                }
                return
            }

            if (res.message) {
                form.setError('root', {
                    message: res.message,
                })
            }

            if (res.errors) {
                for (const [key, val] of Object.entries(res.errors)) {
                    form.setError(key as Path<TIn>, {
                        message: val as string,
                    })
                }
            }
        })
    }

    React.useEffect(() => {
        if (!open) {
            setTimeout(() => {
                // Reset the form when the modal is closed after the animation
                form.reset()
            }, 200)
        }
    }, [open, form])

    return {
        hookForm: form,
        handleSubmit,
        open,
        setOpen,
    }
}
