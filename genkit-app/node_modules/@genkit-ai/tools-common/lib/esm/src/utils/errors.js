const CONNECTION_ERROR_CODES = {
    NODE_ECONNREFUSED: 'ECONNREFUSED',
    BUN_CONNECTION_REFUSED: 'ConnectionRefused',
    ECONNRESET: 'ECONNRESET',
};
const CONNECTION_ERROR_PATTERNS = [
    'ECONNREFUSED',
    'Connection refused',
    'ConnectionRefused',
    'connect ECONNREFUSED',
];
export function isConnectionRefusedError(error) {
    if (!error) {
        return false;
    }
    const errorCode = getErrorCode(error);
    if (errorCode && isConnectionErrorCode(errorCode)) {
        return true;
    }
    if (isErrorWithMessage(error)) {
        return CONNECTION_ERROR_PATTERNS.some((pattern) => error.message.includes(pattern));
    }
    return false;
}
function isConnectionErrorCode(code) {
    return Object.values(CONNECTION_ERROR_CODES).includes(code);
}
function isErrorWithMessage(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string');
}
function extractErrorCode(obj) {
    if (typeof obj === 'object' &&
        obj !== null &&
        'code' in obj &&
        typeof obj.code === 'string') {
        return obj.code;
    }
    return undefined;
}
export function getErrorCode(error) {
    if (!error) {
        return undefined;
    }
    const directCode = extractErrorCode(error);
    if (directCode) {
        return directCode;
    }
    if (typeof error === 'object' && error !== null && 'cause' in error) {
        const causeCode = extractErrorCode(error.cause);
        if (causeCode) {
            return causeCode;
        }
    }
    return undefined;
}
function extractErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (isErrorWithMessage(error)) {
        return error.message;
    }
    return undefined;
}
export function getErrorDetails(error) {
    if (error === null || error === undefined) {
        return 'Unknown error';
    }
    const code = getErrorCode(error);
    const message = extractErrorMessage(error);
    if (message) {
        return code ? `${message} (${code})` : message;
    }
    return String(error);
}
//# sourceMappingURL=errors.js.map