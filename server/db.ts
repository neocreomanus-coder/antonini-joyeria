import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { randomUUID } from "node:crypto";
import {
  InsertUser,
  cartItems,
  categories,
  newsletterSubscribers,
  orderItems,
  orders,
  productVariants,
  products,
  testimonials,
  users,
} from "../drizzle/schema";
import { siteConfig } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    const v = user[field];
    if (v !== undefined) { values[field] = v ?? null; updateSet[field] = v ?? null; }
  }
  if (user.lastSignedIn) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ── Categories ────────────────────────────────────────────────────────────────
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.active, true)).orderBy(categories.sortOrder);
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.sortOrder);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function createCategory(data: { name: string; slug: string; description?: string; imageUrl?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(categories).values({ ...data, active: true });
}

export async function updateCategory(id: number, data: Partial<{ name: string; slug: string; description: string; imageUrl: string; active: boolean; sortOrder: number }>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(categories).where(eq(categories.id, id));
}

// ── Products helpers ──────────────────────────────────────────────────────────
function parseMaterials(raw: unknown, fallback?: string | null): string[] {
  if (Array.isArray(raw)) return raw.filter((value): value is string => typeof value === "string" && value.length > 0);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((value): value is string => typeof value === "string" && value.length > 0);
    } catch {}
  }
  return fallback ? [fallback] : [];
}

function parseProduct<T extends { imageUrlsRaw?: string | null; materialsRaw?: unknown; material?: string | null }>(r: T) {
  const { imageUrlsRaw, materialsRaw, ...rest } = r;
  let imageUrls: string[] = [];
  if (imageUrlsRaw) {
    try { imageUrls = JSON.parse(imageUrlsRaw); } catch {}
  }
  const materials = parseMaterials(materialsRaw, rest.material);
  return { ...rest, material: materials[0] ?? rest.material ?? null, materials, imageUrls };
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function getProducts(opts?: { categoryId?: number; search?: string; featured?: boolean; homeSection?: string; gender?: "masculino" | "femenino" | "unisex" | "ninos"; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(products.active, true)];
  if (opts?.categoryId) conditions.push(eq(products.categoryId, opts.categoryId));
  if (opts?.featured) conditions.push(eq(products.featured, true));
  if (opts?.homeSection) conditions.push(eq(products.homeSection, opts.homeSection) as ReturnType<typeof eq>);
  if (opts?.gender) conditions.push(eq(products.gender, opts.gender) as ReturnType<typeof eq>);
  if (opts?.search) {
    const s = `%${opts.search}%`;
    conditions.push(or(like(products.name, s), like(products.description, s)) as ReturnType<typeof eq>);
  }
  const rows = await db.select({
    id: products.id, name: products.name, slug: products.slug,
    description: products.description, material: products.material, materialsRaw: products.materials,
    basePrice: products.basePrice, originalPrice: products.originalPrice, categoryId: products.categoryId,
    active: products.active, featured: products.featured,
    imageUrlsRaw: products.imageUrls, stock: products.stock,
    createdAt: products.createdAt, updatedAt: products.updatedAt,
    categoryName: categories.name,
    homeSection: products.homeSection,
    volumeMl: products.volumeMl,
    gender: products.gender,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
  return rows.map(parseProduct);
}

export async function getAllProducts(opts?: { limit?: number; offset?: number; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: ReturnType<typeof eq>[] = [];
  if (opts?.search) {
    const s = `%${opts.search}%`;
    conditions.push(or(like(products.name, s), like(products.material, s)) as ReturnType<typeof eq>);
  }
  const q = db.select({
    id: products.id, name: products.name, slug: products.slug,
    description: products.description, material: products.material, materialsRaw: products.materials,
    basePrice: products.basePrice, originalPrice: products.originalPrice, categoryId: products.categoryId,
    active: products.active, featured: products.featured,
    imageUrlsRaw: products.imageUrls, stock: products.stock,
    createdAt: products.createdAt, updatedAt: products.updatedAt,
    categoryName: categories.name,
    homeSection: products.homeSection,
    volumeMl: products.volumeMl,
    gender: products.gender,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
  const rows = conditions.length ? await q.where(and(...conditions)) : await q;
  return rows.map(parseProduct);
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: products.id, name: products.name, slug: products.slug,
    description: products.description, material: products.material, materialsRaw: products.materials,
    basePrice: products.basePrice, originalPrice: products.originalPrice, categoryId: products.categoryId,
    active: products.active, featured: products.featured,
    imageUrlsRaw: products.imageUrls, stock: products.stock,
    createdAt: products.createdAt, updatedAt: products.updatedAt,
    categoryName: categories.name, categorySlug: categories.slug,
  })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  const r = result[0];
  if (!r) return undefined;
  return parseProduct(r);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductVariants(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.active, true)));
}

export async function createProduct(data: {
  name: string; slug: string; description?: string; material?: string; materials?: string[];
  basePrice: string; originalPrice?: string | null; categoryId: number; featured?: boolean; imageUrls?: string[]; stock?: number;
  homeSection?: string; volumeMl?: number; gender?: "masculino" | "femenino" | "unisex" | "ninos";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { imageUrls, materials, ...rest } = data;
  const normalizedMaterials = materials?.filter(Boolean).length ? materials.filter(Boolean) : (data.material ? [data.material] : []);
  const result = await db.insert(products).values({
    ...rest,
    material: normalizedMaterials[0] ?? data.material ?? null,
    materials: JSON.stringify(normalizedMaterials),
    imageUrls: JSON.stringify(imageUrls ?? []),
    active: true,
  });
  return result;
}

export async function updateProduct(id: number, data: Partial<{
  name: string; slug: string; description: string; material: string; materials: string[];
  basePrice: string; originalPrice: string | null; categoryId: number; active: boolean; featured: boolean; imageUrls: string[]; stock: number;
  homeSection: string; volumeMl: number; gender: "masculino" | "femenino" | "unisex" | "ninos";
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const updateData: Record<string, unknown> = { ...data };
  if (data.imageUrls !== undefined) updateData.imageUrls = JSON.stringify(data.imageUrls);
  if (data.materials !== undefined) {
    const normalizedMaterials = data.materials.filter(Boolean);
    updateData.materials = JSON.stringify(normalizedMaterials);
    updateData.material = normalizedMaterials[0] ?? null;
  }
  await db.update(products).set(updateData).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const orderReference = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.productId, id)).limit(1);
  if (orderReference.length > 0) {
    await db.update(products).set({ active: false }).where(eq(products.id, id));
    return { deleted: false, archived: true };
  }
  await db.delete(cartItems).where(eq(cartItems.productId, id));
  await db.delete(productVariants).where(eq(productVariants.productId, id));
  await db.delete(products).where(eq(products.id, id));
  return { deleted: true, archived: false };
}

export async function upsertProductVariants(productId: number, variants: Array<{ type: "size" | "length" | "color"; value: string; priceModifier?: string; stock?: number }>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(productVariants).where(eq(productVariants.productId, productId));
  if (variants.length > 0) {
    await db.insert(productVariants).values(variants.map(v => ({ ...v, productId, active: true })));
  }
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export async function getCartItems(key: { userId?: number; sessionId?: string }) {
  const db = await getDb();
  if (!db) return [];
  const condition = key.userId ? eq(cartItems.userId, key.userId) : eq(cartItems.sessionId, key.sessionId!);
  const rows = await db.select({
    id: cartItems.id, quantity: cartItems.quantity,
    productId: cartItems.productId, variantId: cartItems.variantId,
    sessionId: cartItems.sessionId, userId: cartItems.userId,
    productName: products.name, productSlug: products.slug,
    productMaterial: products.material, productBasePrice: products.basePrice,
    productImageUrlsRaw: products.imageUrls,
    variantType: productVariants.type, variantValue: productVariants.value,
    variantPriceModifier: productVariants.priceModifier,
  })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(condition);
  return rows.map(r => {
    const { productImageUrlsRaw, ...rest } = r;
    let productImageUrls: string[] = [];
    if (productImageUrlsRaw) { try { productImageUrls = JSON.parse(productImageUrlsRaw); } catch {} }
    return { ...rest, productImageUrls };
  });
}

export async function addCartItem(data: { userId?: number; sessionId?: string; productId: number; variantId?: number; quantity: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const condition = data.userId
    ? and(eq(cartItems.userId, data.userId), eq(cartItems.productId, data.productId),
        data.variantId ? eq(cartItems.variantId, data.variantId) : sql`${cartItems.variantId} IS NULL`)
    : and(eq(cartItems.sessionId, data.sessionId!), eq(cartItems.productId, data.productId),
        data.variantId ? eq(cartItems.variantId, data.variantId) : sql`${cartItems.variantId} IS NULL`);
  const existing = await db.select().from(cartItems).where(condition).limit(1);
  if (existing[0]) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + data.quantity }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values(data);
  }
}

export async function updateCartItemQuantity(id: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (quantity <= 0) await db.delete(cartItems).where(eq(cartItems.id, id));
  else await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id));
}

export async function removeCartItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(cartItems).where(eq(cartItems.id, id));
}

export async function clearCart(key: { userId?: number; sessionId?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const condition = key.userId ? eq(cartItems.userId, key.userId) : eq(cartItems.sessionId, key.sessionId!);
  await db.delete(cartItems).where(condition);
}

// ── Orders ────────────────────────────────────────────────────────────────────
export async function createOrder(data: {
  userId?: number; guestEmail?: string; total: string; subtotal: string;
  shippingAddress: { fullName: string; address: string; city: string; department: string; phone: string; notes?: string };
  paymentMethod: "contraentrega" | "wompi";
  stripePaymentIntentId?: string;
  items: Array<{ productId: number; variantId?: number; quantity: number; unitPrice: string; productSnapshot: { name: string; material: string; imageUrl: string; variantLabel?: string } }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const publicToken = randomUUID().replace(/-/g, "");
  const [result] = await db.insert(orders).values({
    publicToken,
    userId: data.userId, guestEmail: data.guestEmail,
    total: data.total, subtotal: data.subtotal,
    shippingAddress: JSON.stringify(data.shippingAddress),
    stripePaymentIntentId: data.stripePaymentIntentId,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentMethod === "wompi" ? "pendiente_comprobante" : "pendiente_contraentrega",
    status: "pendiente",
  });
  const orderId = (result as any).insertId as number;
  if (data.items.length > 0) {
    await db.insert(orderItems).values(data.items.map(item => ({
      orderId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      productSnapshot: JSON.stringify(item.productSnapshot),
    })));
  }
  return { id: orderId, publicToken };
}

export type ShipmentStatus = "pendiente" | "despachado" | "entregado";

export async function getOrderPaymentInfoByToken(publicToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: orders.id,
    publicToken: orders.publicToken,
    total: orders.total,
    paymentMethod: orders.paymentMethod,
    paymentStatus: orders.paymentStatus,
    status: orders.status,
    createdAt: orders.createdAt,
  }).from(orders).where(eq(orders.publicToken, publicToken)).limit(1);
  return result[0];
}

export async function markWompiReceiptSent(publicToken: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders)
    .set({ paymentStatus: "comprobante_enviado" })
    .where(and(eq(orders.publicToken, publicToken), eq(orders.paymentMethod, "wompi")));
  return getOrderPaymentInfoByToken(publicToken);
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  return rows.map(r => ({ ...r, shippingAddress: parseJsonColumn(r.shippingAddress) }));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  const r = result[0];
  if (!r) return undefined;
  return { ...r, shippingAddress: parseJsonColumn(r.shippingAddress) };
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return rows.map(r => ({ ...r, productSnapshot: parseJsonColumn(r.productSnapshot) }));
}

export function parseJsonColumn<T>(value: unknown): T | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value as T;

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  return null;
}

export async function getAllOrders(opts?: { limit?: number; offset?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: ReturnType<typeof eq>[] = [];
  if (opts?.status) conditions.push(eq(orders.status, opts.status as any));
  const q = db.select({
    id: orders.id, userId: orders.userId, guestEmail: orders.guestEmail,
    status: orders.status, total: orders.total, subtotal: orders.subtotal,
    paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus,
    shippingAddress: orders.shippingAddress, stripePaymentIntentId: orders.stripePaymentIntentId,
    stripePaymentStatus: orders.stripePaymentStatus, notes: orders.notes,
    createdAt: orders.createdAt, updatedAt: orders.updatedAt,
    userName: users.name, userEmail: users.email,
  })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
  const rows = conditions.length ? await q.where(and(...conditions)) : await q;
  return rows.map(r => ({ ...r, shippingAddress: parseJsonColumn(r.shippingAddress) }));
}

export async function updateOrderStatus(id: number, status: ShipmentStatus) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function updateOrderShipment(id: number, shipment: { status: ShipmentStatus; interrapidisimoGuide?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders).set({
    status: shipment.status,
    interrapidisimoGuide: shipment.interrapidisimoGuide?.trim() || null,
  }).where(eq(orders.id, id));
}

export async function getPublicOrderTracking(orderNumber: string) {
  const match = orderNumber.trim().toUpperCase().match(/^ANT-(\d{1,10})$/);
  if (!match) return undefined;
  const id = Number(match[1]);
  if (!Number.isSafeInteger(id) || id <= 0) return undefined;

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: orders.id,
    status: orders.status,
    interrapidisimoGuide: orders.interrapidisimoGuide,
    createdAt: orders.createdAt,
  }).from(orders).where(eq(orders.id, id)).limit(1);
  const order = result[0];
  return order ? { ...order, orderNumber: `ANT-${String(order.id).padStart(6, "0")}` } : undefined;
}

export async function updateOrderPaymentStatus(stripePaymentIntentId: string, stripePaymentStatus: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(orders)
    .set({ stripePaymentStatus, status: "pendiente" })
    .where(eq(orders.stripePaymentIntentId, stripePaymentIntentId));
}

// ── Testimonials ──────────────────────────────────────────────────────────────
export async function getTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testimonials).where(eq(testimonials.active, true)).orderBy(desc(testimonials.createdAt));
}

// ── Newsletter ────────────────────────────────────────────────────────────────
export async function subscribeNewsletter(email: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(newsletterSubscribers).values({ email }).onDuplicateKeyUpdate({ set: { email } });
}

// ── Admin stats ───────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: "0", pendingOrders: 0, totalProducts: 0 };
  const [ordersCount] = await db.select({ count: sql<number>`count(*)`, revenue: sql<string>`COALESCE(SUM(total), 0)` }).from(orders);
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "pendiente"));
  const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.active, true));
  return {
    totalOrders: Number(ordersCount?.count ?? 0),
    totalRevenue: String(ordersCount?.revenue ?? "0"),
    pendingOrders: Number(pendingCount?.count ?? 0),
    totalProducts: Number(productsCount?.count ?? 0),
  };
}

// ── Site Config ───────────────────────────────────────────────────────────────
export async function getPopupConfig() {
  const db = await getDb();
  const defaultConfig = { enabled: true, discount: 20, title: "¡Oferta Especial!", subtitle: "Solo por hoy", buttonText: "Aprovechar oferta", productId: null as number | null };
  if (!db) return defaultConfig;
  const rows = await db.select().from(siteConfig).where(eq(siteConfig.configKey, "popup_config")).limit(1);
  if (!rows[0]?.configValue) return defaultConfig;
  try { return { ...defaultConfig, ...JSON.parse(rows[0].configValue) }; } catch { return defaultConfig; }
}

export async function getHeroConfig() {
  const db = await getDb();
  if (!db) return { videoUrl: null, fallbackImage: null, title: null, subtitle: null, description: null, intervalMs: 6500, slides: [] as HeroCarouselSlide[] };
  const rows = await db.select().from(siteConfig).where(
    sql`config_key IN ('hero_video_url','hero_fallback_image','hero_title','hero_subtitle','hero_description','hero_carousel_config')`
  );
  const map: Record<string, string | null> = {};
  for (const row of rows) map[row.configKey] = row.configValue ?? null;
  const legacySlides: HeroCarouselSlide[] = [
    ...(map["hero_video_url"] ? [{ id: "legacy-video", mediaUrl: map["hero_video_url"]!, mediaType: "video" as const }] : []),
    ...(map["hero_fallback_image"] ? [{ id: "legacy-image", mediaUrl: map["hero_fallback_image"]!, mediaType: "image" as const }] : []),
  ];
  let carousel: HeroCarouselConfig = { intervalMs: 6500, slides: legacySlides };
  if (map["hero_carousel_config"]) {
    try {
      const parsed = JSON.parse(map["hero_carousel_config"]!);
      if (Array.isArray(parsed?.slides) && parsed.slides.length > 0) {
        carousel = {
          intervalMs: typeof parsed.intervalMs === "number" ? Math.min(15000, Math.max(3000, parsed.intervalMs)) : 6500,
          slides: parsed.slides.filter((slide: unknown): slide is HeroCarouselSlide => typeof slide === "object" && slide !== null && typeof (slide as HeroCarouselSlide).id === "string" && typeof (slide as HeroCarouselSlide).mediaUrl === "string" && ((slide as HeroCarouselSlide).mediaType === "image" || (slide as HeroCarouselSlide).mediaType === "video")),
        };
      }
    } catch { /* Se conservan las diapositivas heredadas si el valor almacenado no es válido. */ }
  }
  return {
    videoUrl: map["hero_video_url"] ?? null,
    fallbackImage: map["hero_fallback_image"] ?? null,
    title: map["hero_title"] ?? "Joyas que cuentan tu historia",
    subtitle: map["hero_subtitle"] ?? "Exportadores & Mayoristas · Oro 18K Certificado",
    description: map["hero_description"] ?? "Fabricantes y exportadores de joyería en oro 18k.",
    intervalMs: carousel.intervalMs,
    slides: carousel.slides,
  };
}

export async function updateSiteConfig(key: string, value: string | null) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(siteConfig).values({ configKey: key, configValue: value }).onDuplicateKeyUpdate({
    set: { configValue: value },
  });
  return { success: true };
}

export type HeroCarouselSlide = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
};

export type HeroCarouselConfig = {
  intervalMs: number;
  slides: HeroCarouselSlide[];
};

export async function updateHeroCarouselConfig(config: HeroCarouselConfig) {
  return updateSiteConfig("hero_carousel_config", JSON.stringify(config));
}

export type PromoCarouselSlide = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  ctaLabel: string;
  ctaHref: string;
};

export type PromoCarouselConfig = {
  intervalMs: number;
  slides: PromoCarouselSlide[];
};

const defaultPromoCarouselConfig: PromoCarouselConfig = {
  intervalMs: 6000,
  slides: [],
};

export async function getPromoCarouselConfig(): Promise<PromoCarouselConfig> {
  const db = await getDb();
  if (!db) return defaultPromoCarouselConfig;
  const rows = await db.select().from(siteConfig).where(eq(siteConfig.configKey, "promo_carousel_config")).limit(1);
  if (!rows[0]?.configValue) return defaultPromoCarouselConfig;
  try {
    const parsed = JSON.parse(rows[0].configValue) as Partial<PromoCarouselConfig>;
    return {
      intervalMs: Math.min(15000, Math.max(3000, Number(parsed.intervalMs) || 6000)),
      slides: Array.isArray(parsed.slides) ? parsed.slides : [],
    };
  } catch {
    return defaultPromoCarouselConfig;
  }
}

export async function updatePromoCarouselConfig(config: PromoCarouselConfig) {
  return updateSiteConfig("promo_carousel_config", JSON.stringify(config));
}

// ── Delivery Photos ───────────────────────────────────────────────────────────
export type DeliveryPhoto = {
  id: string;
  imageUrl: string;
  alt: string;
};

export type DeliveryPhotosConfig = {
  photos: DeliveryPhoto[];
};

const defaultDeliveryPhotosConfig: DeliveryPhotosConfig = {
  photos: [
    { id: "delivery-1", imageUrl: "/manus-storage/cliente-1_8037453c.jpg", alt: "Cliente feliz 1" },
    { id: "delivery-2", imageUrl: "/manus-storage/cliente-2_4156edc6.jpg", alt: "Cliente feliz 2" },
    { id: "delivery-3", imageUrl: "/manus-storage/cliente-3_68607b4d.jpg", alt: "Cliente feliz 3" },
    { id: "delivery-4", imageUrl: "/manus-storage/cliente-4_1752b95c.jpg", alt: "Cliente feliz 4" },
    { id: "delivery-5", imageUrl: "/manus-storage/cliente-5_554386b1.jpg", alt: "Cliente feliz 5" },
    { id: "delivery-6", imageUrl: "/manus-storage/cliente-6_63df3e68.jpg", alt: "Cliente feliz 6" },
  ],
};

export async function getDeliveryPhotosConfig(): Promise<DeliveryPhotosConfig> {
  const db = await getDb();
  if (!db) return defaultDeliveryPhotosConfig;
  const rows = await db.select().from(siteConfig).where(eq(siteConfig.configKey, "delivery_photos_config")).limit(1);
  if (!rows[0]?.configValue) return defaultDeliveryPhotosConfig;
  try {
    const parsed = JSON.parse(rows[0].configValue) as Partial<DeliveryPhotosConfig>;
    return {
      photos: Array.isArray(parsed.photos)
        ? parsed.photos.filter((photo): photo is DeliveryPhoto =>
            typeof photo?.id === "string" && typeof photo?.imageUrl === "string" && typeof photo?.alt === "string"
          )
        : defaultDeliveryPhotosConfig.photos,
    };
  } catch {
    return defaultDeliveryPhotosConfig;
  }
}

export async function updateDeliveryPhotosConfig(config: DeliveryPhotosConfig) {
  return updateSiteConfig("delivery_photos_config", JSON.stringify(config));
}

// ── Manual Admin Login ────────────────────────────────────────────────────────
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function createAdminUser(username: string, passwordHash: string, name?: string, email?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(users).values({
    username,
    passwordHash,
    name: name || username,
    email: email || `${username}@admin.local`,
    openId: `admin-${username}-${Date.now()}`,
    loginMethod: "manual",
    role: "admin",
  });
  return result;
}

export async function updateAdminPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
  return { success: true };
}
