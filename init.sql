DROP DATABASE database_name;

CREATE DATABASE IF NOT EXISTS database_name;
USE database_name;

CREATE USER IF NOT EXISTS 'database_user'@'%' IDENTIFIED BY 'database_password';
GRANT ALL PRIVILEGES ON database_name.* TO 'database_user'@'%';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    average_rating DECIMAL(3, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    review_text TEXT,
    rating INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
