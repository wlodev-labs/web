import { z } from 'zod/v4'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import type { FieldValues, Path } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useNavigate } from '@tanstack/react-router'
import { unsuccessfulResponse } from '@/lib/responses'
import {
    generateDefaultValues,
    type FormBaseHandleSubmit,
    type FormBaseHandleSubmitReturn,
    type FormBaseProps,
    type FormBaseReturn,
    type FormBaseSchema,
} from './forms'

type UseFormInlineHandleSubmitReturn<TIn extends FieldValues> =
    | (FormBaseHandleSubmitReturn<TIn> & {
          reset?: boolean
      })
    | void

type UseFormInlineProps<TSchema extends FormBaseSchema> = FormBaseProps<TSchema>

export const useFormInline = <TSchema extends FormBaseSchema>({
    formSchema,
    defaultValues,
    ...props
}: UseFormInlineProps<TSchema>): FormBaseReturn<
    TSchema,
    FormBaseHandleSubmit<
        z.input<TSchema>,
        z.output<TSchema>,
        UseFormInlineHandleSubmitReturn<z.input<TSchema>>
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

    const handleSubmit: FormBaseHandleSubmit<
        TIn,
        TOut,
        UseFormInlineHandleSubmitReturn<TIn>
    > = fn => {
        return form.handleSubmit(async data => {
            const res = await fn(data, {
                unsuccessfulResponse,
            })
            if (!res) {
                return
            }

            if (!res.type || (res.type === 'success' && !res.errors)) {
                if (res.message) {
                    toast.success(res.message)
                }

                if (res.redirect) {
                    return navigate(res.redirect)
                }

                // We sometimes want to suppress the form reset for situations like account settings profile, where
                // default values are set, so this reset causes a second of flickering with the old values
                if (typeof res.reset === 'undefined' || res.reset) {
                    form.reset()
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

    return {
        hookForm: form,
        handleSubmit,
    }
}
