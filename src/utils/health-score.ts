export const assessmentVersions = [
	"v1_quick_vitality_check",
	"v2_deep_longevity_assessment",
] as const;

export type AssessmentVersion = (typeof assessmentVersions)[number];

export const assessmentQuestionCategoriesByVersion: Record<
	AssessmentVersion,
	Record<string, string>
> = {
	v1_quick_vitality_check: {
		v1_q1: "Movement",
		v1_q2: "Nutrition",
		v1_q3: "Sleep",
		v1_q4: "Mental Wellness",
		v1_q5: "Hydration",
		v1_q6: "Recovery",
		v1_q7: "Energy",
	},
	v2_deep_longevity_assessment: {
		v2_q1: "Movement",
		v2_q2: "Movement",
		v2_q3: "Nutrition",
		v2_q4: "Nutrition",
		v2_q5: "Sleep",
		v2_q6: "Sleep",
		v2_q7: "Mental Health",
		v2_q8: "Mental Health",
		v2_q9: "Social Wellness",
		v2_q10: "Biomarkers",
		v2_q11: "Habits",
		v2_q12: "Habits",
		v2_q13: "Recovery",
		v2_q14: "Environment",
		v2_q15: "Purpose",
	},
};

export const assessmentQuestionIdsByVersion: Record<
	AssessmentVersion,
	string[]
> = {
	v1_quick_vitality_check: Object.keys(
		assessmentQuestionCategoriesByVersion.v1_quick_vitality_check,
	),
	v2_deep_longevity_assessment: Object.keys(
		assessmentQuestionCategoriesByVersion.v2_deep_longevity_assessment,
	),
};

export const healthBrandTiers = [
	{
		brand: "Equinox",
		tier: "Performance & Lifestyle",
		min: 0,
		max: 20,
	},
	{
		brand: "Six Senses",
		tier: "Holistic Mind-Body",
		min: 21,
		max: 40,
	},
	{
		brand: "Canyon Ranch",
		tier: "Integrative Preventive Health",
		min: 41,
		max: 60,
	},
	{
		brand: "SHA Wellness Clinic",
		tier: "Medical Nutrition & Longevity Science",
		min: 61,
		max: 80,
	},
	{
		brand: "Lanserhof",
		tier: "Precision Medical Longevity",
		min: 81,
		max: 100,
	},
] as const;

export type HealthBrandTier = (typeof healthBrandTiers)[number];

export type AssessmentAnswers = Record<string, number>;

export type HealthScoreResult = {
	totalScore: number;
	maxScore: number;
	overallScore: number;
	categoryScores: Record<string, number>;
	brandTier: HealthBrandTier;
};

export const calculateHealthScore = (
	version: AssessmentVersion,
	answers: AssessmentAnswers,
): HealthScoreResult => {
	const questionCategoryMap = assessmentQuestionCategoriesByVersion[version];
	const categoryTotals = new Map<string, { total: number; max: number }>();

	let totalScore = 0;
	let maxScore = 0;

	for (const [questionId, category] of Object.entries(questionCategoryMap)) {
		const score = answers[questionId] ?? 0;

		totalScore += score;
		maxScore += 4;

		const existing = categoryTotals.get(category) ?? { total: 0, max: 0 };
		existing.total += score;
		existing.max += 4;
		categoryTotals.set(category, existing);
	}

	const categoryScores: Record<string, number> = {};
	for (const [category, value] of categoryTotals.entries()) {
		categoryScores[category] =
			value.max > 0 ? Math.round((value.total / value.max) * 100) : 0;
	}

	const overallScore =
		maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

	const fallbackTier = healthBrandTiers[healthBrandTiers.length - 1];
	if (!fallbackTier) {
		throw new Error("Health score tiers are not configured");
	}

	const brandTier =
		healthBrandTiers.find(
			(candidate) =>
				overallScore >= candidate.min && overallScore <= candidate.max,
		) ?? fallbackTier;

	return {
		totalScore,
		maxScore,
		overallScore,
		categoryScores,
		brandTier,
	};
};
