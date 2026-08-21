import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  username: varchar("username", { length: 100 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Categories ────────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("imageUrl"),
  active: boolean("active").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ── Products ──────────────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  material: varchar("material", { length: 100 }),
  materials: text("materials"),
  basePrice: decimal("basePrice", { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal("originalPrice", { precision: 12, scale: 2 }),
  categoryId: int("categoryId").notNull(),
  active: boolean("active").default(true).notNull(),
  featured: boolean("featured").default(false).notNull(),
  imageUrls: text("imageUrls"),
  homeSection: varchar("homeSection", { length: 64 }),
  volumeMl: int("volumeMl"),
  gender: mysqlEnum("gender", ["masculino", "femenino", "unisex", "ninos"]),
  stock: int("stock").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ── Product Variants ──────────────────────────────────────────────────────────
export const productVariants = mysqlTable("product_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["size", "length", "color"]).notNull(),
  value: varchar("value", { length: 100 }).notNull(),
  priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }),
  stock: int("stock").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;

// ── Cart Items ────────────────────────────────────────────────────────────────
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }),
  userId: int("userId"),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

// ── Orders ────────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  publicToken: varchar("publicToken", { length: 64 }).unique(),
  userId: int("userId"),
  guestEmail: varchar("guestEmail", { length: 320 }),
  paymentMethod: mysqlEnum("paymentMethod", ["contraentrega", "wompi"])
    .default("contraentrega")
    .notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pendiente_contraentrega", "pendiente_comprobante", "comprobante_enviado", "verificado"])
    .default("pendiente_contraentrega")
    .notNull(),
  status: mysqlEnum("status", ["pendiente", "despachado", "entregado"])
    .default("pendiente")
    .notNull(),
  interrapidisimoGuide: varchar("interrapidisimoGuide", { length: 100 }),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  shippingAddress: text("shippingAddress"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripePaymentStatus: varchar("stripePaymentStatus", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ── Order Items ───────────────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  productSnapshot: text("productSnapshot"),
});
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ── Testimonials ──────────────────────────────────────────────────────────────
export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  comment: text("comment").notNull(),
  rating: int("rating").default(5).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Testimonial = typeof testimonials.$inferSelect;

// ── Newsletter Subscribers ────────────────────────────────────────────────────
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// ── Site Config ───────────────────────────────────────────────────────────────
export const siteConfig = mysqlTable("site_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("config_key", { length: 100 }).notNull().unique(),
  configValue: text("config_value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteConfig = typeof siteConfig.$inferSelect;
