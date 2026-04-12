import type { Request, RequestHandler } from "express";

type CaptchaProvider = "turnstile" | "recaptcha";

type CaptchaVerifyResponse = {
	success?: boolean;
	action?: string;
	score?: number;
	[key: string]: unknown;
};

const parseBooleanEnv = (value: string | undefined): boolean => {
	if (!value) {
		return false;
	}

	const normalized = value.trim().toLowerCase();
	return normalized === "1" || normalized === "true" || normalized === "yes";
};

const parseProvider = (value: string | undefined): CaptchaProvider => {
	if (value?.trim().toLowerCase() === "recaptcha") {
		return "recaptcha";
	}

	return "turnstile";
};

const parseOptionalScore = (value: string | undefined): number | null => {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return null;
	}

	if (parsed < 0 || parsed > 1) {
		return null;
	}

	return parsed;
};

const getCaptchaToken = (req: Request): string | null => {
	const fromHeader = req.header("x-captcha-token")?.trim();
	if (fromHeader) {
		return fromHeader;
	}

	if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
		const candidate = (req.body as Record<string, unknown>).captchaToken;
		if (typeof candidate === "string" && candidate.trim()) {
			return candidate.trim();
		}
	}

	return null;
};

const getClientIp = (req: Request): string | null => {
	const forwarded = req.header("x-forwarded-for");
	if (forwarded) {
		const ip = forwarded.split(",")[0]?.trim();
		if (ip) {
			return ip;
		}
	}

	if (req.ip) {
		return req.ip;
	}

	return req.socket.remoteAddress ?? null;
};

const verifyCaptcha = async ({
	provider,
	secret,
	token,
	remoteIp,
}: {
	provider: CaptchaProvider;
	secret: string;
	token: string;
	remoteIp: string | null;
}): Promise<CaptchaVerifyResponse> => {
	const params = new URLSearchParams({
		secret,
		response: token,
	});

	if (remoteIp) {
		params.set("remoteip", remoteIp);
	}

	const url =
		provider === "recaptcha"
			? "https://www.google.com/recaptcha/api/siteverify"
			: "https://challenges.cloudflare.com/turnstile/v0/siteverify";

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		return { success: false };
	}

	return (await response.json()) as CaptchaVerifyResponse;
};

export const verifyLeadCaptcha: RequestHandler = async (req, res, next) => {
	const provider = parseProvider(process.env.LEAD_CAPTCHA_PROVIDER);
	const secret = process.env.LEAD_CAPTCHA_SECRET?.trim() ?? "";
	const required = parseBooleanEnv(process.env.LEAD_CAPTCHA_REQUIRED);
	const minScore = parseOptionalScore(process.env.LEAD_CAPTCHA_MIN_SCORE);
	const expectedAction = process.env.LEAD_CAPTCHA_EXPECTED_ACTION?.trim();

	if (!secret) {
		if (required) {
			res.status(503).json({ message: "Captcha is not configured" });
			return;
		}

		next();
		return;
	}

	const token = getCaptchaToken(req);

	if (!token) {
		res.status(400).json({ message: "Missing captcha token" });
		return;
	}

	try {
		const result = await verifyCaptcha({
			provider,
			secret,
			token,
			remoteIp: getClientIp(req),
		});

		if (!result.success) {
			res.status(400).json({ message: "Captcha verification failed" });
			return;
		}

		if (
			provider === "recaptcha" &&
			minScore !== null &&
			typeof result.score === "number" &&
			result.score < minScore
		) {
			res.status(400).json({ message: "Captcha score is too low" });
			return;
		}

		if (expectedAction) {
			const action = typeof result.action === "string" ? result.action : "";

			if (action !== expectedAction) {
				res.status(400).json({ message: "Captcha action mismatch" });
				return;
			}
		}

		next();
	} catch (error) {
		console.error("[CAPTCHA_VERIFY_FAILED]", error);
		res.status(502).json({ message: "Captcha verification unavailable" });
	}
};
