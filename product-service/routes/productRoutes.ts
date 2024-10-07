import express from "express";
const router = express.Router();
import db from "../utils/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Product, ProductUpdateRequest } from "../utils/types";
import redisClient from "../utils/redisClient";

router.get("/", async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM products"
    );
    const products = rows as Product[];
    connection.release();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const productId = req.params.id;

    const cachedRating = await redisClient.get(
      `product:${productId}:average_rating`
    );
    if (cachedRating) {
      console.log("Average rating found in cache:", cachedRating);

      const connection = await db.getConnection();
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT id, name, description, price FROM products WHERE id = ?",
        [productId]
      );
      connection.release();

      if (rows.length === 0) {
        res.status(404).json({ error: "Product not found" });
      } else {
        const product = {
          ...rows[0],
          average_rating: parseFloat(cachedRating),
        };
        res.json(product as Product);
      }
    } else {
      console.log(
        "Average rating not found in cache, fetching from database..."
      );
      const connection = await db.getConnection();
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT * FROM products WHERE id = ?",
        [productId]
      );
      connection.release();

      if (rows.length === 0) {
        res.status(404).json({ error: "Product not found" });
      } else {
        res.json(rows[0] as Product);
      }
    }
  } catch (error: any) {
    console.error("Error fetching product:", error);
    if (error.code === "ER_NO_SUCH_TABLE") {
      res.status(500).json({ error: "Database error: Table not found" });
    } else {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  }
});

router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const { name, description, price }: Product = req.body;

    if (!name || !description || !price) {
      res
        .status(400)
        .json({ error: "Name, description and price are required" });
    } else if (typeof price !== "number" || price <= 0) {
      res.status(400).json({ error: "Price must be a positive number" });
    } else {
      const connection = await db.getConnection();
      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO products (name, description, price) VALUES (?, ?, ?)",
        [name, description, price]
      );
      connection.release();
      res.status(201).json({
        id: result.insertId,
        message: "Product created successfully",
      });
    }
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const productId = req.params.id;
    const { name, description, price }: ProductUpdateRequest = req.body;

    if (!name || !description || !price) {
      res
        .status(400)
        .json({ error: "Name, description and price are required" });
    } else if (typeof price !== "number" || price <= 0) {
      res.status(400).json({ error: "Price must be a positive number" });
    } else {
      const connection = await db.getConnection();
      const [result] = await connection.query<ResultSetHeader>(
        "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?",
        [name, description, price, productId]
      );
      connection.release();

      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Product not found" });
      } else {
        res.json({ message: "Product updated successfully" });
      }
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const productId = req.params.id;
    const connection = await db.getConnection();

    const [reviewRows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM reviews WHERE product_id = ?",
      [productId]
    );

    if (reviewRows.length > 0) {
      res.status(400).json({
        error: "Cannot delete product because it has associated reviews.",
      });
    } else {
      const [result] = await connection.query<ResultSetHeader>(
        "DELETE FROM products WHERE id = ?",
        [productId]
      );
      connection.release();

      if (result.affectedRows === 0) {
        res.status(404).json({ error: "Product not found" });
      } else {
        const redisKeys = [
          `product:${productId}:average_rating`,
          `product:${productId}:reviews`,
        ];
        await redisClient.del(redisKeys);
        res.json({ message: "Product deleted successfully" });
      }
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
