// Response types for the form hooks
export type ResponseType = 'success' | 'error'

export type UnsuccessfulResponse = <TErrorCode extends string>(
    // Error code returned from the app API
    apiCode: TErrorCode | null,

    // Map api error code to the user-friendly message
    errorsDictionary: Partial<Record<TErrorCode, string>>,

    // The message to be displayed to the user when none of the error codes match
    generalMessage: string,
) => { type: ResponseType; message: string }

// Symplifying the error handling from the app API as the error response structure
// is consistent so we can leverage by checking the api error code
export const unsuccessfulResponse: UnsuccessfulResponse = (
    apiCode,
    dict,
    generalMessage,
) => {
    let message = generalMessage
    if (apiCode && apiCode in dict && typeof dict[apiCode] === 'string') {
        message = dict[apiCode]
    }

    return {
        type: 'error',
        message,
    }
}
