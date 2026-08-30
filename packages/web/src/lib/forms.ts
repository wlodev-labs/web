import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form'

export type BaseReusableFormFieldProps<TValue> = {
    formId: string
    field: Omit<ControllerRenderProps, 'name' | 'value'> & {
        name: string
        value: TValue
    }
    fieldState: ControllerFieldState
}
