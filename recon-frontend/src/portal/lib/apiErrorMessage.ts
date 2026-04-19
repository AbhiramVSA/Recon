type ErrorWithBody = {
    body?: unknown;
    message?: unknown;
};

function isObjectLike(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getErrorBody(err: unknown): unknown {
    if (!isObjectLike(err) || !('body' in err)) return undefined;
    return (err as ErrorWithBody).body;
}

function getErrorMessage(err: unknown): string | undefined {
    if (!isObjectLike(err) || !('message' in err)) return undefined;
    const message = (err as ErrorWithBody).message;
    return typeof message === 'string' ? message : undefined;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
    const body = getErrorBody(err);
    if (isObjectLike(body) && 'detail' in body) {
        const detail = (body as { detail: unknown }).detail;
        if (typeof detail === 'string') return detail;
        return JSON.stringify(detail);
    }

    const message = getErrorMessage(err);
    if (message) return message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}
