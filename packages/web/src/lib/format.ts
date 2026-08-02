import {
    format as dateFNSFormat,
    formatDistanceToNow,
    intervalToDuration,
    isMatch,
    isValid,
    parse,
    set,
    type Duration,
    type Locale,
} from 'date-fns'

export type FormatTimestampBaseProps = {
    locale?: Locale
}

export type TimestampFormat =
    | 'dd MMMM yyyy'
    | 'dd MMMM yyyy HH:mm'
    | 'dd MMMM yyyy HH:mm:ss'
    | 'dd.MM.yyyy HH:mm'
    | 'dd.MM.yyyy HH:mm:ss'
    | 'dd-MM-yyyy'
    | 'yyyy-MM-dd'
    | 'dd MMMM yyyy'
    | 'HH:mm'
    | 'HH:mm:ss'
    | 'HH:mm:ss.SSS'

export type FormatTimestampProps = FormatTimestampBaseProps

export const formatTimestamp = (
    timestamp: string | Date,
    format: TimestampFormat,
    props?: FormatTimestampProps,
): string => {
    return dateFNSFormat(timestamp, format, { locale: props?.locale })
}

export type FormatAgoProps = FormatTimestampBaseProps & {
    useSuffix?: boolean
}

export const formatAgo = (
    timestamp: string | Date,
    props?: FormatAgoProps,
): string => {
    return formatDistanceToNow(timestamp, {
        locale: props?.locale,
        addSuffix: props?.useSuffix ?? true,
    })
}

type DurationUnit = 'day' | 'hour' | 'minute' | 'second'

const DURATION_ORDER: Array<[keyof Duration, DurationUnit]> = [
    ['days', 'day'],
    ['hours', 'hour'],
    ['minutes', 'minute'],
    ['seconds', 'second'],
]

export type FormatDurationProps = FormatTimestampBaseProps

export const formatDuration = (
    msec: number,
    props?: FormatDurationProps,
): string => {
    const code = props?.locale?.code ?? 'en-US'
    const d = intervalToDuration({ start: 0, end: msec })

    const fmt = (value: number, unit: DurationUnit) =>
        new Intl.NumberFormat(code, {
            style: 'unit',
            unit,
            unitDisplay: 'narrow',
        }).format(value)

    const parts = DURATION_ORDER.filter(([key]) => d[key]).map(([key, unit]) =>
        fmt(d[key] as number, unit),
    )
    return parts.length ? parts.join(' ') : fmt(0, 'second')
}

class InvalidTimeError extends Error {
    constructor(time: string) {
        super(`Invalid time format: ${time}`)
        this.name = 'InvalidTimeError'
    }
}

/**
 * Combines a date and a time string into a single Date object.
 * @param date - The date as a string or Date object.
 * @param time - The time as a string in 'HH:mm' or 'HH:mm:ss' format.
 * @returns A new Date object representing the combined date and time.
 * @throws {InvalidTimeError} If the time string is not in a valid format.
 */
export const combineDateAndTime = (date: string | Date, time: string): Date => {
    const format = time.length === 5 ? 'HH:mm' : 'HH:mm:ss'
    if (!isMatch(time, format)) {
        throw new InvalidTimeError(time)
    }

    const parsed = parse(time, format, new Date())
    if (!isValid(parsed)) {
        throw new InvalidTimeError(time)
    }

    return set(date, {
        hours: parsed.getHours(),
        minutes: parsed.getMinutes(),
        seconds: parsed.getSeconds(),
        milliseconds: 0,
    })
}
