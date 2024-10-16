# Product Review System

This project implements a two-service system for managing product reviews.

## Services

- `product-service`: A RESTful API service for managing products and reviews.
- `review-processing-service`: A service that consumes review events, calculates average ratings, and updates the database and cache.

## Technologies Used

- Node.js with Express.js for the RESTful API.
- TypeScript for type safety.
- MySQL for the database.
- Redis for caching.
- RabbitMQ for message queuing.
- Docker Compose for containerization and orchestration.

## Project Structure

- `product-service`: Contains the code and configuration for the product service.
- `review-processing-service`: Contains the code and configuration for the review processing service.
- `docker-compose.yml`: Defines the services and their configurations for Docker Compose.

## Design Decisions

- Two-service architecture: Separating the product management and review processing logic into two services allows for better scalability and maintainability.
- Message queue: Using RabbitMQ enables asynchronous communication between the services, improving responsiveness and decoupling.
- Caching: Caching average ratings and product reviews in Redis enhances performance and reduces database load.
- Database: MySQL was chosen for its relational structure and ACID properties.
- Docker Compose: Containerization with Docker Compose simplifies development, testing, and deployment.

## Trade-offs

- Complexity: The two-service architecture adds some complexity compared to a single-service solution.
- Caching strategy: The current caching strategy is simple (caching all reviews). More sophisticated strategies (e.g., caching only recent reviews) could be explored for further optimization.
- Error handling: The current error handling is basic and could be made more comprehensive.

## Setup and Running

1.  Install Docker and Docker Compose.
2.  Clone the repository.
3.  Run `docker-compose up -d --build` to build and start the services.
4.  Access the product service API at `http://localhost:3000`.

### Product Service

**Base URL:** `http://localhost:3000`

#### Products

- `GET /products`: List all products.
  - Response: Array of `Product` objects (see `types.ts` for the structure).
- `GET /products/:id`: Get product details by ID.
  - Response: `Product` object with `average_rating` included.
- `POST /products`: Create a new product.
  - Request body: `Product` object (excluding `id` and `average_rating`).
  - Response: `201 Created` with the newly created product's ID.
- `PUT /products/:id`: Update an existing product.
  - Request body: `ProductUpdateRequest` object (see `types.ts`).
  - Response: `200 OK` or `404 Not Found`.
- `DELETE /products/:id`: Delete a product (only if it has no reviews).
  - Response: `200 OK` or `404 Not Found`.

#### Reviews

- `GET /products/:id/reviews`: List reviews for a product.
  - Response: Array of `Review` objects (see `types.ts`).
- `POST /products/:id/reviews`: Add a review to a product.
  - Request body: `ReviewRequest` object (see `types.ts`).
  - Response: `201 Created` with the newly created review's ID.
- `PUT /products/:id/reviews/:reviewId`: Update a review.
  - Request body: `ReviewRequest` object.
  - Response: `200 OK` or `404 Not Found`.
- `DELETE /products/:id/reviews/:reviewId`: Delete a review.
  - Response: `200 OK` or `404 Not Found`.

## Considerations

- Error Handling: The API includes basic error handling and returns appropriate status codes and error messages.
- Validation: Input validation is performed on product and review data to ensure data integrity.
- Caching: Average ratings and product reviews are cached in Redis to improve performance.
- Concurrency: The `review-processing-service` can handle multiple events concurrently.
- Scalability: The design allows for horizontal scaling of the `review-processing-service`.

## Future Improvements

- Implement more robust error handling and logging.
- Add more comprehensive data validation.
- Implement security measures like authentication and authorization.
- Explore more advanced caching strategies.
- Write unit and integration tests.
