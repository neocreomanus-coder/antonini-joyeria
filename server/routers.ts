import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import * as db from "./db";
import { storagePut } from "./storage";
import { notifyTelegramAboutOrder } from "./telegram";

// ── Admin guard ───────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acceso solo para administradores" });
  return next({ ctx });
});

// ── Categories router ─────────────────────────────────────────────────────────
const categoriesRouter = router({
  list: publicProcedure.query(() => db.getCategories()),
  listAll: adminProcedure.query(() => db.getAllCategories()),
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => db.getCategoryBySlug(input.slug)),
  create: adminProcedure.input(z.object({
    name: z.string().min(1), slug: z.string().min(1),
    description: z.string().optional(), imageUrl: z.string().optional(), sortOrder: z.number().optional(),
  })).mutation(({ input }) => db.createCategory(input)),
  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(), slug: z.string().optional(),
    description: z.string().optional(), imageUrl: z.string().optional(),
    active: z.boolean().optional(), sortOrder: z.number().optional(),
  })).mutation(({ input: { id, ...data } }) => db.updateCategory(id, data)),
  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteCategory(input.id)),
});

// ── Products router ───────────────────────────────────────────────────────────
const productsRouter = router({
  list: publicProcedure.input(z.object({
    categoryId: z.number().optional(),
    search: z.string().optional(),
    gender: z.enum(["masculino", "femenino", "unisex", "ninos"]).optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }).optional()).query(({ input }) => db.getProducts(input)),

  byHomeSection: publicProcedure.input(z.object({ section: z.string(), limit: z.number().optional() })).query(({ input }) => db.getProducts({ homeSection: input.section, limit: input.limit ?? 8 })),

  featured: publicProcedure.query(() => db.getProducts({ featured: true, limit: 12 })),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const product = await db.getProductBySlug(input.slug);
    if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Producto no encontrado" });
    const variants = await db.getProductVariants(product.id);
    return { ...product, variants };
  }),

  getVariants: publicProcedure.input(z.object({ productId: z.number() })).query(({ input }) => db.getProductVariants(input.productId)),

  // Admin procedures
  adminList: adminProcedure.input(z.object({
    limit: z.number().optional(), offset: z.number().optional(), search: z.string().optional(),
  }).optional()).query(({ input }) => db.getAllProducts(input)),

  create: adminProcedure.input(z.object({
    name: z.string().min(1), slug: z.string().min(1),
    description: z.string().optional(), material: z.string().optional(), materials: z.array(z.string()).optional(),
    basePrice: z.string(), originalPrice: z.string().nullable().optional(), reference: z.string().trim().max(100).nullable().optional(), categoryId: z.number(),
    featured: z.boolean().optional(), imageUrls: z.array(z.string()).optional(), stock: z.number().optional(),
    homeSection: z.string().optional(),
    volumeMl: z.number().optional(),
    gender: z.enum(["masculino", "femenino", "unisex", "ninos"]).optional(),
    variants: z.array(z.object({
      type: z.enum(["size", "length", "color"]),
      value: z.string(), priceModifier: z.string().optional(), stock: z.number().optional(),
    })).optional(),
  })).mutation(async ({ input }) => {
    const { variants, ...productData } = input;
    const result = await db.createProduct(productData);
    const insertId = (result as any)[0]?.insertId as number;
    if (variants && variants.length > 0 && insertId) {
      await db.upsertProductVariants(insertId, variants);
    }
    return { success: true, id: insertId };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(), slug: z.string().optional(),
    description: z.string().optional(), material: z.string().optional(), materials: z.array(z.string()).optional(),
    basePrice: z.string().optional(), originalPrice: z.string().nullable().optional(), reference: z.string().trim().max(100).nullable().optional(), categoryId: z.number().optional(),
    active: z.boolean().optional(), featured: z.boolean().optional(),
    homeSection: z.string().optional(),
    volumeMl: z.number().optional(),
    gender: z.enum(["masculino", "femenino", "unisex", "ninos"]).optional(),
    imageUrls: z.array(z.string()).optional(), stock: z.number().optional(),
    variants: z.array(z.object({
      type: z.enum(["size", "length", "color"]),
      value: z.string(), priceModifier: z.string().optional(), stock: z.number().optional(),
    })).optional(),
  })).mutation(async ({ input }) => {
    const { id, variants, ...data } = input;
    await db.updateProduct(id, data);
    if (variants !== undefined) await db.upsertProductVariants(id, variants);
    return { success: true };
  }),

  toggleActive: adminProcedure.input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(({ input }) => db.updateProduct(input.id, { active: input.active })),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => db.deleteProduct(input.id)),

  uploadImage: adminProcedure.input(z.object({
    filename: z.string(), contentType: z.string(), dataBase64: z.string(),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.dataBase64, "base64");
    const key = `products/${Date.now()}-${input.filename}`;
    const { url } = await storagePut(key, buffer, input.contentType);
    return { url, key };
  }),
});

// ── Cart router ───────────────────────────────────────────────────────────────
const cartRouter = router({
  get: publicProcedure.input(z.object({ sessionId: z.string().optional() }).optional()).query(({ ctx, input }) => {
    const userId = ctx.user?.id;
    const sessionId = input?.sessionId;
    if (!userId && !sessionId) return [];
    return db.getCartItems({ userId, sessionId });
  }),

  add: publicProcedure.input(z.object({
    productId: z.number(), variantId: z.number().optional(),
    quantity: z.number().min(1).default(1), sessionId: z.string().optional(),
  })).mutation(({ ctx, input }) => {
    const userId = ctx.user?.id;
    return db.addCartItem({ userId, sessionId: input.sessionId, productId: input.productId, variantId: input.variantId, quantity: input.quantity });
  }),

  updateQuantity: publicProcedure.input(z.object({ id: z.number(), quantity: z.number().min(0) }))
    .mutation(({ input }) => db.updateCartItemQuantity(input.id, input.quantity)),

  remove: publicProcedure.input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.removeCartItem(input.id)),

  clear: publicProcedure.input(z.object({ sessionId: z.string().optional() }).optional())
    .mutation(({ ctx, input }) => {
      const userId = ctx.user?.id;
      const sessionId = input?.sessionId;
      if (!userId && !sessionId) return;
      return db.clearCart({ userId, sessionId });
    }),
});

// ── Promotional codes router ──────────────────────────────────────────────────
const promoCodesRouter = router({
  validate: publicProcedure.input(z.object({ code: z.string().trim().min(1).max(64) })).query(async ({ input }) => {
    const promo = await db.getActivePromoCode(input.code);
    if (!promo) return { valid: false as const };
    return { valid: true as const, code: promo.code, discountPercent: promo.discountPercent };
  }),

  adminList: adminProcedure.query(() => db.getPromoCodes()),

  create: adminProcedure.input(z.object({
    code: z.string().trim().min(2).max(64),
    discountPercent: z.number().int().min(1).max(90),
    active: z.boolean().optional(),
  })).mutation(async ({ input }) => {
    await db.createPromoCode(input);
    return { success: true };
  }),

  update: adminProcedure.input(z.object({
    id: z.number(),
    code: z.string().trim().min(2).max(64).optional(),
    discountPercent: z.number().int().min(1).max(90).optional(),
    active: z.boolean().optional(),
  })).mutation(async ({ input: { id, ...data } }) => {
    await db.updatePromoCode(id, data);
    return { success: true };
  }),
});

// ── Orders router ─────────────────────────────────────────────────────────────
const ordersRouter = router({
  create: publicProcedure.input(z.object({
    guestEmail: z.string().email().optional(),
    total: z.string().optional(), subtotal: z.string().optional(),
    promoCode: z.string().trim().max(64).optional(),
    shippingAddress: z.object({
      fullName: z.string(), address: z.string(), city: z.string(),
      department: z.string(), phone: z.string(), notes: z.string().optional(),
    }),
    stripePaymentIntentId: z.string().optional(),
    paymentMethod: z.enum(["contraentrega", "wompi"]),
    sessionId: z.string().optional(),
    items: z.array(z.object({
      productId: z.number(), variantId: z.number().optional(),
      quantity: z.number().int().min(1).max(99), unitPrice: z.string(),
      productSnapshot: z.object({
        name: z.string(), material: z.string(), imageUrl: z.string(), reference: z.string().optional(), variantLabel: z.string().optional(),
      }),
    })),
  })).mutation(async ({ ctx, input }) => {
    const userId = ctx.user?.id;
    let pricing: db.PromoPricing;
    try {
      pricing = await db.calculateOrderPricing(input.items, input.promoCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible validar el código promocional";
      throw new TRPCError({ code: "BAD_REQUEST", message });
    }
    const verifiedItems = input.items.map((item, index) => ({ ...item, unitPrice: pricing.unitPrices[index] ?? item.unitPrice }));
    const createdOrder = await db.createOrder({
      ...input,
      ...pricing,
      items: verifiedItems,
      userId,
    });
    void notifyTelegramAboutOrder({
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      paymentMethod: input.paymentMethod,
      total: pricing.total,
      popupDiscountPercent: pricing.popupDiscountPercent,
      popupDiscountAmount: pricing.popupDiscountAmount,
      promoCode: pricing.promoCode,
      promoDiscountAmount: pricing.promoDiscountAmount,
      customerName: input.shippingAddress.fullName,
      customerPhone: input.shippingAddress.phone,
      notes: input.shippingAddress.notes,
      items: input.items,
    });
    if (userId) await db.clearCart({ userId });
    else if (input.sessionId) await db.clearCart({ sessionId: input.sessionId });
    return { orderId: createdOrder.id, paymentToken: createdOrder.publicToken, paymentMethod: input.paymentMethod, orderNumber: createdOrder.orderNumber };
  }),

  paymentInfo: publicProcedure.input(z.object({ token: z.string().min(24).max(64) })).query(async ({ input }) => {
    const order = await db.getOrderPaymentInfoByToken(input.token);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido no encontrado" });
    return order;
  }),

  confirmWompiReceipt: publicProcedure.input(z.object({ token: z.string().min(24).max(64) })).mutation(async ({ input }) => {
    const order = await db.markWompiReceiptSent(input.token);
    if (!order || order.paymentMethod !== "wompi") throw new TRPCError({ code: "NOT_FOUND", message: "Pago Wompi no encontrado" });
    return { orderId: order.id, orderNumber: db.formatOrderNumber(order) };
  }),

  track: publicProcedure.input(z.object({ orderNumber: z.string().min(4).max(32) })).query(async ({ input }) => {
    const order = await db.getPublicOrderTracking(input.orderNumber);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "No encontramos un pedido con ese número" });
    return order;
  }),

  myOrders: protectedProcedure.query(({ ctx }) => db.getOrdersByUserId(ctx.user.id)),

  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const order = await db.getOrderById(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (order.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const items = await db.getOrderItems(input.id);
    return { ...order, items };
  }),

  // Admin
  adminList: adminProcedure.input(z.object({
    limit: z.number().optional(), offset: z.number().optional(), status: z.string().optional(),
  }).optional()).query(({ input }) => db.getAllOrders(input)),

  adminGetById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const order = await db.getOrderById(input.id);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    const items = await db.getOrderItems(input.id);
    return { ...order, items };
  }),

  adminGetByOrderNumber: adminProcedure.input(z.object({
    orderNumber: z.string().trim().regex(/^ANT-\d{6,}$/i),
  })).query(async ({ input }) => {
    const order = await db.getOrderByNumber(input.orderNumber);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    const items = await db.getOrderItems(order.id);
    return { ...order, items };
  }),

  updateStatus: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["pendiente", "despachado", "entregado"]),
  })).mutation(({ input }) => db.updateOrderStatus(input.id, input.status)),

  updateShipment: adminProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["pendiente", "despachado", "entregado"]),
    shippingCarrier: z.enum(["coordinadora", "interrapidisimo"]),
    interrapidisimoGuide: z.string().max(100).optional().nullable(),
  })).mutation(({ input }) => db.updateOrderShipment(input.id, input)),

  delete: adminProcedure.input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteOrder(input.id)),
});

// ── Testimonials & Newsletter ─────────────────────────────────────────────────
const testimonialsRouter = router({
  list: publicProcedure.query(() => db.getTestimonials()),
});

const newsletterRouter = router({
  subscribe: publicProcedure.input(z.object({ email: z.string().email() }))
    .mutation(({ input }) => db.subscribeNewsletter(input.email)),
});

// ── Admin dashboard ───────────────────────────────────────────────────────────
const adminRouter = router({
  stats: adminProcedure.query(() => db.getAdminStats()),
});

// In-memory chunk store for hero video uploads
const heroChunkStore: Record<string, { chunks: string[]; filename: string; mimeType: string }> = {};

// ── Site Config router ────────────────────────────────────────────────────────
const siteConfigRouter = router({
  // Public: read hero config
  getHero: publicProcedure.query(() => db.getHeroConfig()),

  // Admin: update hero video URL
  updateHeroVideo: adminProcedure
    .input(z.object({ videoUrl: z.string().url().nullable() }))
    .mutation(({ input }) => db.updateSiteConfig("hero_video_url", input.videoUrl)),

  // Admin: update hero fallback image
  updateHeroImage: adminProcedure
    .input(z.object({ imageUrl: z.string() }))
    .mutation(({ input }) => db.updateSiteConfig("hero_fallback_image", input.imageUrl)),

  // Admin: update hero texts
  updateHeroTexts: adminProcedure
    .input(z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.title) await db.updateSiteConfig("hero_title", input.title);
      if (input.subtitle) await db.updateSiteConfig("hero_subtitle", input.subtitle);
      if (input.description) await db.updateSiteConfig("hero_description", input.description);
      return { success: true };
    }),

  updateHeroCarousel: adminProcedure
    .input(z.object({
      intervalMs: z.number().min(3000).max(15000),
      slides: z.array(z.object({
        id: z.string().min(1).max(100),
        mediaUrl: z.string().min(1).max(1000),
        mediaType: z.enum(["image", "video"]),
      })).min(1).max(8),
    }))
    .mutation(({ input }) => db.updateHeroCarouselConfig(input)),

  // Admin: upload video chunk (supports large files via chunked base64)
  uploadHeroVideoChunk: adminProcedure
    .input(z.object({
      chunk: z.string(),       // base64 chunk
      chunkIndex: z.number(),
      totalChunks: z.number(),
      filename: z.string(),
      mimeType: z.string(),
      uploadId: z.string(),    // client-generated UUID to group chunks
    }))
    .mutation(async ({ input }) => {
      // Store chunk in memory keyed by uploadId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = heroChunkStore;
      if (!store[input.uploadId]) store[input.uploadId] = { chunks: [], filename: input.filename, mimeType: input.mimeType };
      store[input.uploadId].chunks[input.chunkIndex] = input.chunk;

      // If all chunks received, assemble and upload
      if (store[input.uploadId].chunks.filter(Boolean).length === input.totalChunks) {
        const fullBase64 = store[input.uploadId].chunks.join("");
        const buffer = Buffer.from(fullBase64, "base64");
        const key = `hero-videos/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await db.updateSiteConfig("hero_video_url", url);
        delete store[input.uploadId];
        return { done: true, url };
      }
      return { done: false, url: null };
    }),

  // Admin: upload fallback image to S3 (images are small, single chunk ok)
  uploadHeroImage: adminProcedure
    .input(z.object({ base64: z.string(), filename: z.string(), mimeType: z.string() }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `hero-images/${Date.now()}-${input.filename}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await db.updateSiteConfig("hero_fallback_image", url);
      return { url };
    }),

  // Public: read popup config
  getPopup: publicProcedure.query(() => db.getPopupConfig()),

  // Public: read independent promotional carousel
  getPromoCarousel: publicProcedure.query(() => db.getPromoCarouselConfig()),

  // Admin: save promotional carousel slides and automatic rotation interval
  updatePromoCarousel: adminProcedure
    .input(z.object({
      intervalMs: z.number().min(3000).max(15000),
      slides: z.array(z.object({
        id: z.string().min(1),
        mediaUrl: z.string().min(1),
        mediaType: z.enum(["image", "video"]),
        ctaLabel: z.string().min(1).max(40),
        ctaHref: z.string().min(1).max(240),
      })).max(12),
    }))
    .mutation(({ input }) => db.updatePromoCarouselConfig(input)),

  // Public: read delivery photos shown in the trust gallery
  getDeliveryPhotos: publicProcedure.query(() => db.getDeliveryPhotosConfig()),

  // Admin: save the order and accessibility text of the trust gallery photos
  updateDeliveryPhotos: adminProcedure
    .input(z.object({
      photos: z.array(z.object({
        id: z.string().min(1).max(100),
        imageUrl: z.string().min(1).max(1000),
        alt: z.string().min(1).max(160),
      })).max(24),
    }))
    .mutation(({ input }) => db.updateDeliveryPhotosConfig(input)),

  // Admin: update popup config
  updatePopup: adminProcedure
    .input(z.object({
      enabled: z.boolean(),
      discount: z.number().min(1).max(90),
      title: z.string(),
      subtitle: z.string(),
      buttonText: z.string(),
      productId: z.number().nullable(),
    }))
    .mutation(({ input }) => db.updateSiteConfig("popup_config", JSON.stringify(input))),
});

// ── App router ────────────────────────────────────────────────────────────────
// Manual login procedure for admin
const manualLoginProcedure = publicProcedure
  .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
  .mutation(async ({ input, ctx }) => {
    const user = await db.getUserByUsername(input.username);
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
    if (!user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
    
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuario o contraseña incorrectos" });
    
    if (user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acceso solo para administradores" });
    
    // Create JWT session token
    const cookieOptions = getSessionCookieOptions(ctx.req);
    const sessionToken = await sdk.createSessionToken(
      user.openId,
      {
        expiresInMs: 7 * 24 * 60 * 60 * 1000,
        name: (user.name || user.username) as string,
      }
    );
    ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    // Update lastSignedIn
    await db.updateAdminPassword(user.id, user.passwordHash);
    
    return { success: true, user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role } };
  });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ?? null),
    loginManual: manualLoginProcedure,
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  categories: categoriesRouter,
  products: productsRouter,
  cart: cartRouter,
  promoCodes: promoCodesRouter,
  orders: ordersRouter,
  testimonials: testimonialsRouter,
  newsletter: newsletterRouter,
  admin: adminRouter,
  siteConfig: siteConfigRouter,
});

export type AppRouter = typeof appRouter;
