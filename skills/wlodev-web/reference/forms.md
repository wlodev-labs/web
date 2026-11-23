# Wlodev Forms Reference

Complete reference for creating forms in TanStack Router web apps with examples.

## Form ID

Before creating a form, define a unique `formId` like this:

```ts
const formId = 'my-form'
```

Then, use this `formId` with form element:

```tsx
<form id={formId} onSubmit={handleSubmit}>
```

### Using `getFieldId` Utility

Use `getFieldId` with the `@wlodev/web` package to generate unique field IDs for form fields. This ensures that each field has a unique identifier based on the `formId` and the field name. For example:

```tsx
import { getFieldId } from '@wlodev/web'

return (
    <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor={getFieldId(formId, field.name)}>
            {label}
        </FieldLabel>
        <Input
            {...field}
            id={getFieldId(formId, field.name)}
            aria-invalid={fieldState.invalid}
        />
    </Field>
)
```

### Submit Button `form` Attribute

Regular forms where the submit button is inside the form element do not require a `form` attribute. However, if the submit button is outside the form element, you must set the `form` attribute to the `formId` of the form you want to submit. It's common for forms inside modals to have the submit button outside the form element in the `<ModalFooter>` component. In such cases, set the `form` attribute like this:

```tsx
<Modal>
    <ModalContent>
        <form id={formId} onSubmit={handleSubmit}>
            {/* form fields */}
        </form>
        <ModalFooter>
            <Button type='submit' form={formId} disabled={isSubmitting}>
                Submit
            </Button>
        </ModalFooter>
    </ModalContent>
</Modal>
```

## Basic Form Structure

Use either `useFormInline` or `useFormModal` hooks from `@wlodev/web`, which are a starting point for creating any form. They are wrappers around `react-hook-form` and provide a set of reusable hooks and utilities. In order to buil a complete form, you need to combine the form hook with the regular `<form>` element, `zod` form schema, `<Controller>` encapsulating fields, and a set of shadcn/ui components. Here's an example of a basic form structure using the `useFormInline` hook:

```tsx
import { z } from 'zod'
import { Controller } from 'react-hook-form'
import { useFormInline, getFieldId, zFormOptional } from '@wlodev/web'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from '#/components/ui/input-group'
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '#/components/ui/field'

const formSchema = z.object({
    name: z.string({
        error: 'Name is required',
    }),
    description: zFormOptional(z.string()),
})

const { hookForm, handleSubmit } = useFormInline({
    formSchema,
})

const {
    control,
    formState: { errors, isSubmitting },
} = hookForm

const onSubmit = handleSubmit(async (data, { unsuccessfulResponse }) => {})

const formId = 'my-form'
return (
    <form id={formId} onSubmit={onSubmit}>
        <FieldGroup>
            <Controller
                name='name'
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={getFieldId(formId, field.name)} required>
                            Name
                        </FieldLabel>
                        <Input
                            {...field}
                            id={getFieldId(formId, field.name)}
                            aria-invalid={fieldState.invalid}
                            required
                        />
                        {fieldState.error && (
                            <FieldError>{fieldState.error.message}</FieldError>
                        )}
                    </Field>
                )}
            />
            <Controller
                name='description'
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={getFieldId(formId, field.name)}>
                            Description
                        </FieldLabel>
                        <InputGroup>
                            <InputGroupTextarea
                                {...field}
                                id={getFieldId(formId, field.name)}
                                aria-invalid={fieldState.invalid}
                            />
                            <InputGroupAddon align='block-end'>
                                <InputGroupText>
                                    {(field.value ?? '').length}/512
                                </InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                        <FieldDescription>
                            A brief description of the form. This field is optional and can be removed if not needed. The description can provide additional context or instructions for the user filling out the form.
                        </FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />
            {errors.root && <FieldError errors={[errors.root]} />}
            <Field>
                <Button type='submit' disabled={isSubmitting}>
                    Submit
                </Button>
            </Field>
    </FieldGroup>
)
```

> `zFormOptional` is a utility function from `@wlodev/web` that allows you to define optional fields of any type in your form schema using `zod`. It solves the issue of uncontrolled form fields errors when using `zod` with `react-hook-form`.

> `unsuccessfulResponse` is a utility function from `@wlodev/web` that allows you to handle unsuccessful responses from the server when submitting a form. It can be used to set form errors based on the response from the server, allowing you to provide feedback to the user about what went wrong. Here's an example of how to use this function in the `onSubmit` handler of a form:

```ts
const onSubmit = handleSubmit(async (data, { unsuccessfulResponse }) => {
    return unsuccessfulResponse(
        errorCode,
        {
            invalid_name:
                'The name provided is invalid. Please enter a valid name.',
        },
        'An unexpected error occurred while submitting the form. Please try again later',
    )
})
```

In case of `useFormModal`, structure is more or less the same. We get `open` and `setOpen` from the hook, and we can use them to control the modal state. The form is placed inside the `<ModalContent>` component, and the submit button is placed inside the `<ModalFooter>` component. Here's a partial example of a form structure using the `useFormModal` hook:

```tsx
import { z } from 'zod'
import { Controller } from 'react-hook-form'
import { useFormModal, getFieldId, zFormOptional } from '@wlodev/web'

const formSchema = z.object({
    name: z.string({
        error: 'Name is required',
    }),
    description: zFormOptional(z.string()),
})

const { open, setOpen, hookForm, handleSubmit } = useFormModal({
    formSchema,
})

const {
    control,
    formState: { errors, isSubmitting },
} = hookForm

const onSubmit = handleSubmit(async (data, { unsuccessfulResponse }) => s{})

const formId = 'my-form'
return (
    <Modal open={open} onOpenChange={setOpen}>
        <ModalTrigger>
            Open Form Modal
        </ModalTrigger>
        <ModalContent
            title='Form Modal'
            description='This is a form modal with a form inside.'
        >
            <form id={formId} onSubmit={onSubmit}>
                {/* form fields */}
            </form>
            <ModalFooter>
                <Button type='submit' form={formId} disabled={isSubmitting}>
                    Submit
                </Button>
            </ModalFooter>
        </ModalContent>
    </Modal>
)
```

## Form Submission and Error Handling

When submitting a form, you can handle errors returned from the server using the custom `unsuccessfulResponse` utility function from `@wlodev/web`. This function allows you to set form errors based on the response from the server, providing feedback to the user about what went wrong. Every API function is generated from OpenAPI spec and if the response is not successful, it will throw an error. In order to retrieve the valid error code, we can use the `getApiErrorCode` utility function from `@wlodev/web`, which takes the thrown error and returns the typed error code. You pass generic type of the API function response error to the `getApiErrorCode` function. If the error code is not recognized, it will return `null`. Here's an example of how to use these functions in the `onSubmit` handler of a form:

```ts
import { getApiErrorCode } from '@wlodev/web'

const onSubmit = handleSubmit(async (data, { unsuccessfulResponse }) => {
    try {
        await apiCall({
            name: data.name,
            description: data.description,
        })
    } catch (error) {
        const errorCode = getApiErrorCode<apiCallResponseError>(error)
        if (!errorCode) {
            throw error
        }

        return unsuccessfulResponse(
            errorCode,
            {
                invalid_name:
                    'The name provided is invalid. Please enter a valid name.',
            },
            'An unexpected error occurred while submitting the form. Please try again later',
        )
    }
})
```

> While handling form submission, leave out the `unsuccessfulResponse` function second argument, where you can define custom error messages for specific error codes. Leave it as an empty object `{}`.

### Returning `message` and `redirect` from `handleSubmit`

Besides the `unsuccessfulResponse` function, the `handleSubmit` function from `@wlodev/web` also allows to return a `message` string, which will be displayed in a form of a toast notification. Also, it allows to return a `redirect`, which is a wrapper for the `NavigateOptions` from `TanStack Router`, which allows to redirect the user to another page after successful form submission. Here's an example of how to use these return values in the `onSubmit` handler of a form:

```ts
import { getApiErrorCode } from '@wlodev/web'

const onSubmit = handleSubmit(async (data, { unsuccessfulResponse }) => {
    try {
        await apiCall({
            name: data.name,
            description: data.description,
        })
    } catch (error) {
        const errorCode = getApiErrorCode<apiCallResponseError>(error)
        if (!errorCode) {
            throw error
        }

        return unsuccessfulResponse(
            errorCode,
            {
                invalid_name:
                    'The name provided is invalid. Please enter a valid name.',
            },
            'An unexpected error occurred while submitting the form. Please try again later',
        )
    }

    return {
        message: 'Form submitted successfully!',
        redirect: {
            to: '/success-page',
            replace: true,
        },
    }
})
```

## Creating Reusable Form Fields

Sometimes, reusable form fields are needed, especially when the same field is used in multiple forms. To create a reusable form field, you start by defining a `BaseReusableFormFieldProps` type from `@wlodev/web` with generic type `T`, which include necessary props for the field, such as `formId`, `field`, `fieldState`. It could also include additional props specific to the field, such as optional `label`, `description`, `required`, etc. Then, you can create a reusable form field component that takes these props and renders the field accordingly. Use `shadcn/ui` components to build the reusable form field component. Here's an example of how to create a reusable form field component:

```tsx
import { type BaseReusableFormFieldProps } from '@wlodev/web'
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'

export type SimpleInputFieldProps<T> = BaseReusableFormFieldProps<T> & {
    label: string
    description?: string
    placeholder?: string
    required?: boolean
}

export const SimpleInputField = <T extends string | undefined>({
    field,
    fieldState,
    formId,
    label,
    description,
    placeholder,
    required,
}: SimpleInputFieldProps<T>) => {
    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel
                htmlFor={getFieldId(formId, field.name)}
                required={required}
            >
                {label}
            </FieldLabel>
            <Input
                {...field}
                id={getFieldId(formId, field.name)}
                aria-invalid={fieldState.invalid}
                placeholder={placeholder}
                required={required}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    )
}
```

Here's an example of how to use the `SimpleInputField` component in a form:

```tsx
<Controller
    control={control}
    name='name'
    render={({ field, fieldState }) => (
        <SimpleInputField
            field={field}
            fieldState={fieldState}
            formId={formId}
            label='Name'
            required
        />
    )}
/>
```

Here's a more complex example of a reusable form field component that includes a select dropdown with options:

```tsx
import {
    formatComboboxItems,
    type BaseReusableFormFieldProps,
} from '@wlodev/web'
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '#/components/ui/field'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '#/components/ui/select'

export type ReportIntervalFieldProps<T> = BaseReusableFormFieldProps<T> & {
    label?: string
    description?: string
    required?: boolean
}

export const ReportIntervalField = <T extends number>({
    field,
    fieldState,
    formId,
    label,
    description,
    required,
}: ReportIntervalFieldProps<T>) => {
    const items = formatComboboxItems(
        reportIntervalMapping,
        ([value, label]) => ({
            label,
            value: value.toString(),
        }),
    )

    return (
        <Field data-invalid={fieldState.invalid}>
            <FieldLabel
                htmlFor={getFieldId(formId, field.name)}
                required={required}
            >
                {label ?? 'Interval'}
            </FieldLabel>
            <Select
                name={field.name}
                value={field.value.toString()}
                onValueChange={val => field.onChange(Number(val))}
                items={items}
            >
                <SelectTrigger
                    id={getFieldId(formId, field.name)}
                    aria-invalid={fieldState.invalid}
                >
                    <SelectValue placeholder='Select interval' />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Interwał</SelectLabel>
                        {reportIntervalMapping.map(([value, label]) => (
                            <SelectItem key={value} value={value.toString()}>
                                {label.charAt(0).toUpperCase() + label.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    )
}
```
