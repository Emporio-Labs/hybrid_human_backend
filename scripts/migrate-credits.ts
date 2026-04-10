import { config } from "dotenv";
import mongoose from "mongoose";
import Membership from "../src/models/Membership";
import connectDB from "../src/utils/db";

config();

const hasFlag = (flag: string): boolean => process.argv.slice(2).includes(flag);

const printUsage = () => {
	console.log("Usage: bun run migrate:credits [--dry-run]");
	console.log("  --dry-run   Show what would change without writing updates");
};

const isValidNonNegativeNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value) && value >= 0;

async function main() {
	const showHelp = hasFlag("--help") || hasFlag("-h");
	if (showHelp) {
		printUsage();
		return;
	}

	const dryRun = hasFlag("--dry-run");

	try {
		await connectDB();

		type MembershipCreditShape = {
			_id: mongoose.Types.ObjectId;
			creditsIncluded?: unknown;
			creditsRemaining?: unknown;
		};

		const memberships = (await Membership.find({})
			.select("_id creditsIncluded creditsRemaining")
			.lean()) as MembershipCreditShape[];

		const operations: Array<{
			updateOne: {
				filter: { _id: mongoose.Types.ObjectId };
				update: {
					$set: { creditsIncluded?: number; creditsRemaining?: number };
				};
			};
		}> = [];

		let invalidIncludedCount = 0;
		let invalidRemainingCount = 0;

		for (const membership of memberships) {
			const setPayload: {
				creditsIncluded?: number;
				creditsRemaining?: number;
			} = {};

			if (!isValidNonNegativeNumber(membership.creditsIncluded)) {
				setPayload.creditsIncluded = 0;
				invalidIncludedCount += 1;
			}

			if (!isValidNonNegativeNumber(membership.creditsRemaining)) {
				setPayload.creditsRemaining = 0;
				invalidRemainingCount += 1;
			}

			if (Object.keys(setPayload).length > 0) {
				operations.push({
					updateOne: {
						filter: { _id: membership._id },
						update: { $set: setPayload },
					},
				});
			}
		}

		console.log(`Total memberships scanned: ${memberships.length}`);
		console.log(`Memberships requiring migration: ${operations.length}`);
		console.log(
			`Invalid/missing creditsIncluded fields: ${invalidIncludedCount}`,
		);
		console.log(
			`Invalid/missing creditsRemaining fields: ${invalidRemainingCount}`,
		);

		if (operations.length === 0) {
			console.log(
				"No migration needed. All membership credit fields are valid.",
			);
			return;
		}

		if (dryRun) {
			console.log("Dry run complete. No database changes were applied.");
			return;
		}

		const result = await Membership.bulkWrite(operations, { ordered: false });

		console.log("Migration complete.");
		console.log(`Matched documents: ${result.matchedCount}`);
		console.log(`Modified documents: ${result.modifiedCount}`);
	} catch (error) {
		console.error("Credit migration failed:", error);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
}

await main();
