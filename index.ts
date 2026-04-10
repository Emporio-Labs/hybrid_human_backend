import app from "./src/app";
import connectDB from "./src/utils/db";
import { registerGmailWatch } from "./src/utils/email.service";

const port = Number(process.env.PORT ?? 3000);

const start = async () => {
	try {
		await connectDB();
	} catch (error) {
		console.error("Failed to initialize database connection:", error);
		process.exit(1);
	}

	const pubsubTopic = process.env.PUBSUB_TOPIC;
	if (pubsubTopic) {
		await registerGmailWatch(pubsubTopic);

		setInterval(() => {
			void registerGmailWatch(pubsubTopic);
		}, 6 * 24 * 60 * 60 * 1000);
	} else {
		console.warn("PUBSUB_TOPIC is not set. Gmail watch registration is skipped.");
	}

	app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
	});
};

await start();
