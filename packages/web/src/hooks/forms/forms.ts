import { z, type ZodType } from 'zod/v4'
import type {
    DefaultValues,
    FieldValues,
    Path,
    UseFormProps,
    UseFormReturn,
} from 'react-hook-form'
import type { ResponseType, UnsuccessfulResponse } from '../../lib/responses'
import type { NavigateOptions } from '@tanstack/react-router'

type Redirect = NavigateOptions

export type FormBaseSchema = ZodType<FieldValues, FieldValues>

export type FormBaseProps<TSchema extends FormBaseSchema> = Omit<
    UseFormProps<z.input<TSchema>>,
    'resolver' | 'defaultValues'
> & {
    formSchema: TSchema
    defaultValues?: DefaultValues<z.input<TSchema>>
}

export type FormBaseReturn<TSchema extends FormBaseSchema, THandleSubmit> = {
    hookForm: UseFormReturn<z.input<TSchema>, any, z.output<TSchema>>
    handleSubmit: THandleSubmit
}

export type FormBaseHandleSubmitReturn<TIn extends FieldValues> = {
    type?: ResponseType
    message?: string
    errors?: Partial<Record<Path<TIn>, string>>
    redirect?: Redirect
} | void

export type FormBaseHandleSubmit<
    TIn extends FieldValues,
    TOut extends FieldValues,
    TReturn extends FormBaseHandleSubmitReturn<TIn>,
> = (
    fn: (
        data: TOut,
        props: {
            unsuccessfulResponse: UnsuccessfulResponse
        },
    ) => Promise<TReturn>,
) => any

export const generateDefaultValues = <TIn extends FieldValues>(
    schema: FormBaseSchema,
    providedDefaults?: DefaultValues<TIn>,
): DefaultValues<TIn> => {
    if (!(schema instanceof z.ZodObject)) {
        return (providedDefaults || {}) as DefaultValues<TIn>
    }

    const safeDefaults = (providedDefaults || {}) as Record<string, any>
    return Object.entries(schema.shape).reduce(
        (acc, [key, val]) => {
            if (key in safeDefaults) {
                acc[key] = safeDefaults[key]
            } else if (val instanceof z.ZodObject) {
                acc[key] = generateDefaultValues(val, safeDefaults[key])
            } else if (val instanceof z.ZodArray) {
                acc[key] = []
            } else if (val instanceof z.ZodString) {
                acc[key] = ''
            } else if (val instanceof z.ZodNumber) {
                acc[key] = 0
            } else if (val instanceof z.ZodBoolean) {
                acc[key] = false
            } else if (val instanceof z.ZodEmail) {
                acc[key] = ''
            }
            return acc
        },
        {} as Record<string, any>,
    ) as DefaultValues<TIn>
}

export const zFormOptional = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess(val => (val === '' ? undefined : val), schema.optional())
