import express from "express";
import productRoutes from "./routes/productRoutes";
import reviewRoutes from "./routes/reviewRoutes";

const app = express();
const port = 3000;

app.use(express.json());

app.use("/products", productRoutes);
app.use("/products", reviewRoutes);

app.listen(port, () => {
  console.log(`Product service listening on port ${port}`);
});
