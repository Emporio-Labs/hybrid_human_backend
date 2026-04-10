export type ApiErrorCode =
	| "VALIDATION_ERROR"
	| "BAD_REQUEST"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "CONFLICT"
	| "NOT_IMPLEMENTED"
	| "INTERNAL_ERROR"
	| "API_ERROR";

export type ApiErrorEnvelope = {
	error: string;
	code: ApiErrorCode | string;
	details?: unknown;
};

const hasValidationDetails = (details: unknown): boolean => {
	if (Array.isArray(details)) {
		return details.length > 0;
	}

	if (!details || typeof details !== "object") {
		return false;
	}

	return Object.keys(details).length > 0;
};

export const mapStatusToErrorCode = (
	status: number,
	overrideCode?: string,
	details?: unknown,
): ApiErrorCode | string => {
	if (overrideCode) {
		return overrideCode;
	}

	if (status === 400) {
		return hasValidationDetails(details) ? "VALIDATION_ERROR" : "BAD_REQUEST";
	}

	switch (status) {
		case 401:
			return "UNAUTHORIZED";
		case 403:
			return "FORBIDDEN";
		case 404:
			return "NOT_FOUND";
		case 409:
			return "CONFLICT";
		case 501:
			return "NOT_IMPLEMENTED";
		case 500:
			return "INTERNAL_ERROR";
		default:
			return "API_ERROR";
	}
};

export const buildApiErrorEnvelope = ({
	error,
	code,
	details,
}: ApiErrorEnvelope): ApiErrorEnvelope => {
	if (details === undefined) {
		return { error, code };
	}

	return { error, code, details };
};

export const isApiErrorEnvelope = (
	value: unknown,
): value is ApiErrorEnvelope => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.error === "string" && typeof candidate.code === "string"
	);
};
