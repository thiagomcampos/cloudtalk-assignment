import consumeMessages from "./utils/consumeMessagesQueue";
import processReview from "./reviewProcessor";

consumeMessages(processReview)
  .then(() => {
    console.log("Review processing service started");
  })
  .catch((error: any) => {
    console.error("Failed to start review processing service:", error);
  });
