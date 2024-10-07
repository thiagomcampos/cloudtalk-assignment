import express from "express";
const router = express.Router();
import db from "../utils/db";
import publishMessage from "../utils/publishMessageQueue";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Review, ReviewRequest } from "../utils/types";
import redisClient from "../utils/redisClient";

router.get(
  "/:id/reviews",
  async (req: express.Request, res: express.Response) => {
    try {
      const productId = req.params.id;

      const cachedReviews = await redisClient.get(
        `product:${productId}:reviews`
      );
      if (cachedReviews) {
        console.log("Reviews found in cache:", cachedReviews);
        const reviews: Review[] = JSON.parse(cachedReviews);
        res.json(reviews);
      } else {
        console.log("Reviews not found in cache, fetching from database...");
        const connection = await db.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>(
          "SELECT * FROM reviews WHERE product_id = ?",
          [productId]
        );
        const reviews = rows as Review[];
        connection.release();

        await redisClient.set(
          `product:${productId}:reviews`,
          JSON.stringify(reviews)
        );

        res.json(reviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  }
);

router.post(
  "/:id/reviews",
  async (req: express.Request, res: express.Response) => {
    try {
      const productId = req.params.id;
      const { first_name, last_name, review_text, rating }: ReviewRequest =
        req.body;

      if (!first_name || !last_name || !review_text || !rating) {
        res.status(400).json({
          error: "First name, last name, review_text and rating are required",
        });
      } else if (
        typeof rating !== "number" ||
        rating < 1 ||
        rating > 5 ||
        !Number.isInteger(rating)
      ) {
        res
          .status(400)
          .json({ error: "Rating must be an integer between 1 and 5" });
      } else {
        const connection = await db.getConnection();
        const [result] = await connection.query<ResultSetHeader>(
          "INSERT INTO reviews (product_id, first_name, last_name, review_text, rating) VALUES (?, ?, ?, ?, ?)",
          [productId, first_name, last_name, review_text, rating]
        );
        connection.release();

        await publishMessage({
          productId: req.params.id,
          eventType: "add",
        });

        const newReview: Review = {
          id: result.insertId,
          product_id: Number(productId),
          first_name,
          last_name,
          review_text,
          rating,
        };

        const cachedReviewsKey = `product:${productId}:reviews`;
        const cachedReviews = await redisClient.get(cachedReviewsKey);
        let reviews = cachedReviews ? JSON.parse(cachedReviews) : [];
        reviews.push(newReview);
        await redisClient.set(cachedReviewsKey, JSON.stringify(reviews));

        res.status(201).json({
          id: result.insertId,
          message: "Review created successfully",
        });
      }
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  }
);

router.put(
  "/:id/reviews/:reviewId",
  async (req: express.Request, res: express.Response) => {
    try {
      const productId = req.params.id;
      const reviewId = Number(req.params.reviewId);
      const { first_name, last_name, review_text, rating }: ReviewRequest =
        req.body;

      if (!first_name || !last_name || !review_text || !rating) {
        res.status(400).json({
          error: "First name, last name, review_text and rating are required",
        });
      } else if (
        typeof rating !== "number" ||
        rating < 1 ||
        rating > 5 ||
        !Number.isInteger(rating)
      ) {
        res
          .status(400)
          .json({ error: "Rating must be an integer between 1 and 5" });
      } else {
        const connection = await db.getConnection();
        const [result] = await connection.query<ResultSetHeader>(
          "UPDATE reviews SET first_name = ?, last_name = ?, review_text = ?, rating = ? WHERE id = ? AND product_id = ?",
          [first_name, last_name, review_text, rating, reviewId, productId]
        );
        connection.release();

        if (result.affectedRows === 0) {
          res.status(404).json({ error: "Review not found" });
        } else {
          await publishMessage({
            productId,
            eventType: "update",
          });

          const cachedReviewsKey = `product:${productId}:reviews`;
          const cachedReviews = await redisClient.get(cachedReviewsKey);
          if (cachedReviews) {
            const reviews = JSON.parse(cachedReviews);
            const reviewIndex = reviews.findIndex((review: { id: string }) => {
              const numericReviewId = Number(review.id);
              const numericRequestId = Number(reviewId);
              return numericReviewId === numericRequestId;
            });

            if (reviewIndex !== -1) {
              reviews[reviewIndex] = {
                id: reviewId,
                product_id: productId,
                first_name,
                last_name,
                review_text,
                rating,
              };
              await redisClient.set(cachedReviewsKey, JSON.stringify(reviews));
            }
          }

          res.json({ message: "Review updated successfully" });
        }
      }
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  }
);

router.delete("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const productId = req.params.id;
    const reviewId = req.params.reviewId;
    const connection = await db.getConnection();
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM reviews WHERE id = ? AND product_id = ?",
      [reviewId, productId]
    );
    connection.release();

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Review not found" });
    } else {
      await publishMessage({
        productId: req.params.id,
        eventType: "delete",
      });

      const cachedReviewsKey = `product:${productId}:reviews`;
      const cachedReviews = await redisClient.get(cachedReviewsKey);
      if (cachedReviews) {
        const reviews = JSON.parse(cachedReviews);
        const updatedReviews = reviews.filter((review: { id: string }) => {
          const numericReviewId = Number(review.id);
          const numericRequestId = Number(reviewId);
          return numericReviewId !== numericRequestId;
        });
        console.log({ updatedReviews });
        await redisClient.set(cachedReviewsKey, JSON.stringify(updatedReviews));
      }

      res.json({ message: "Review deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
