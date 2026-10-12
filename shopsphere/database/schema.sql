-- ShopSphere database schema (MySQL 8.0+)
-- Safe to run more than once: tables are only created when they do not exist yet.
-- To start over completely run "npm run db:reset" in the server folder.

CREATE DATABASE IF NOT EXISTS shopsphere
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shopsphere;

-- ---------------------------------------------------------------
-- users: customers and administrators
-- Passwords are stored ONLY as bcrypt hashes in password_hash.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------
-- products: the catalog. Money uses DECIMAL, never FLOAT.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(150)  NOT NULL,
  description TEXT          NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  category    VARCHAR(60)   NOT NULL,
  image_url   VARCHAR(500)  NULL,
  stock       INT UNSIGNED  NOT NULL DEFAULT 0,
  rating      DECIMAL(2,1)  NOT NULL DEFAULT 0.0,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category (category),
  KEY idx_products_price (price),
  KEY idx_products_name (name),
  CONSTRAINT chk_products_price  CHECK (price > 0),
  CONSTRAINT chk_products_rating CHECK (rating >= 0 AND rating <= 5)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------
-- cart_items: one row per (user, product). The cart is kept in the
-- database so it survives logout/login and works on any device.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity   INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  KEY idx_cart_product (product_id),
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT chk_cart_quantity CHECK (quantity > 0)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------
-- orders: one row per checkout
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  customer_name VARCHAR(100)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL,
  address       VARCHAR(500)  NOT NULL,
  total         DECIMAL(12,2) NOT NULL,
  status        ENUM('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PLACED',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_user (user_id, created_at),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE = InnoDB;

-- ---------------------------------------------------------------
-- order_items: what was bought. The product name and unit price are
-- copied here so old orders stay correct even if the product is edited
-- or deleted later (product_id becomes NULL when a product is deleted).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NULL,
  product_name VARCHAR(150)  NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  quantity     INT UNSIGNED  NOT NULL,
  line_total   DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)
) ENGINE = InnoDB;
