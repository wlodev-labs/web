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
                return acc
            }
            const value = resolveDefault(val, safeDefaults[key])
            if (value !== NO_DEFAULT) {
                acc[key] = value
            }
            return acc
        },
        {} as Record<string, any>,
    ) as DefaultValues<TIn>
}

const NO_DEFAULT = Symbol('no-default')

const resolveDefault = (schema: unknown, provided?: any): any => {
    if (schema instanceof z.ZodDefault) {
        return schema.def.defaultValue
    }

    if (schema instanceof z.ZodPipe) {
        // `.transform()` / `.pipe()` produce ZodPipe
        return resolveDefault(schema.def.in, provided)
    }

    if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
        // zFormOptional appends .optional(); '' satisfies the z.literal('')
        // union and prevents react-hook-form uncontrolled input warnings
        const inner = resolveDefault(schema.unwrap(), provided)
        return inner === NO_DEFAULT ? '' : inner
    }

    if (schema instanceof z.ZodCatch || schema instanceof z.ZodReadonly) {
        return resolveDefault(schema.def.innerType, provided)
    }

    if (schema instanceof z.ZodObject) {
        return generateDefaultValues(schema, provided)
    } else if (schema instanceof z.ZodArray) {
        return []
    } else if (schema instanceof z.ZodString || schema instanceof z.ZodEmail) {
        return ''
    } else if (schema instanceof z.ZodNumber) {
        return 0
    } else if (schema instanceof z.ZodBoolean) {
        return false
    } else if (schema instanceof z.ZodLiteral) {
        return schema.def.values[0]
    }

    return NO_DEFAULT
}

export const zFormOptional = <T extends z.ZodTypeAny>(schema: T) =>
    z
        .union([schema, z.literal('')])
        .transform(val => (val === '' ? undefined : val))
        .optional()
