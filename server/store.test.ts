import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const { notifyTelegramAboutOrderMock } = vi.hoisted(() => ({
  notifyTelegramAboutOrderMock: vi.fn().mockResolvedValue({ sent: true }),
}));

vi.mock("./telegram", () => ({
  notifyTelegramAboutOrder: notifyTelegramAboutOrderMock,
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// Mock db module
vi.mock("./db", () => ({
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Cadenas", slug: "cadenas", active: true, sortOrder: 1 },
  ]),
  getAllCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Cadenas", slug: "cadenas", active: true, sortOrder: 1 },
  ]),
  getCategoryBySlug: vi.fn().mockResolvedValue({ id: 1, name: "Cadenas", slug: "cadenas" }),
  createCategory: vi.fn().mockResolvedValue(undefined),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getProducts: vi.fn().mockResolvedValue([
    { id: 1, name: "Cadena Cubana", slug: "cadena-cubana", basePrice: "250000", categoryId: 1, active: true, featured: true, imageUrls: [], material: "ORO 18K", stock: 10, createdAt: new Date(), updatedAt: new Date(), categoryName: "Cadenas" },
  ]),
  getAllProducts: vi.fn().mockResolvedValue([]),
  getProductBySlug: vi.fn().mockResolvedValue({
    id: 1, name: "Cadena Cubana", slug: "cadena-cubana", basePrice: "250000", categoryId: 1, active: true, featured: true, imageUrls: [], material: "ORO 18K", stock: 10, createdAt: new Date(), updatedAt: new Date(), categoryName: "Cadenas", categorySlug: "cadenas", variants: [],
  }),
  getProductVariants: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn().mockResolvedValue([{ insertId: 1 }]),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  upsertProductVariants: vi.fn().mockResolvedValue(undefined),
  getCartItems: vi.fn().mockResolvedValue([]),
  addCartItem: vi.fn().mockResolvedValue(undefined),
  updateCartItemQuantity: vi.fn().mockResolvedValue(undefined),
  removeCartItem: vi.fn().mockResolvedValue(undefined),
  clearCart: vi.fn().mockResolvedValue(undefined),
  getPromoCodes: vi.fn().mockResolvedValue([{ id: 1, code: "AHORRA15", discountPercent: 15, active: true }]),
  getActivePromoCode: vi.fn().mockResolvedValue({ id: 1, code: "AHORRA15", discountPercent: 15, active: true }),
  createPromoCode: vi.fn().mockResolvedValue(undefined),
  updatePromoCode: vi.fn().mockResolvedValue(undefined),
  calculateOrderPricing: vi.fn().mockResolvedValue({ subtotal: "250000", total: "250000", unitPrices: ["250000"] }),
  createOrder: vi.fn().mockResolvedValue({ id: 42, publicToken: "pedido-publico-de-prueba-000000000001", orderNumber: "ANT-030101" }),
  formatOrderNumber: vi.fn((order: { id: number; orderNumber?: string | null }) => order.orderNumber ?? `ANT-${String(order.id).padStart(6, "0")}`),
  getOrdersByUserId: vi.fn().mockResolvedValue([]),
  getOrderPaymentInfoByToken: vi.fn().mockResolvedValue({
    id: 42,
    publicToken: "pedido-publico-de-prueba-000000000001",
    total: "250000",
    paymentMethod: "wompi",
    paymentStatus: "pendiente_comprobante",
    status: "pendiente",
    createdAt: new Date(),
  }),
  markWompiReceiptSent: vi.fn().mockResolvedValue({
    id: 42,
    publicToken: "pedido-publico-de-prueba-000000000001",
    total: "250000",
    paymentMethod: "wompi",
    paymentStatus: "comprobante_enviado",
    status: "pendiente",
    createdAt: new Date(),
  }),
  getOrderById: vi.fn().mockResolvedValue({ id: 42, status: "pendiente", total: "250000", subtotal: "250000", userId: 1, createdAt: new Date(), updatedAt: new Date(), shippingAddress: null, guestEmail: null, stripePaymentIntentId: null, stripePaymentStatus: null, notes: null }),
  getOrderByNumber: vi.fn().mockResolvedValue({ id: 42, orderNumber: "ANT-030101", status: "pendiente", total: "250000", subtotal: "250000", userId: 1, createdAt: new Date(), updatedAt: new Date(), shippingAddress: null, guestEmail: null, stripePaymentIntentId: null, stripePaymentStatus: null, notes: null }),
  getOrderItems: vi.fn().mockResolvedValue([]),
  getAllOrders: vi.fn().mockResolvedValue([]),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  updateOrderShipment: vi.fn().mockResolvedValue(undefined),
  deleteOrder: vi.fn().mockResolvedValue(undefined),
  getPublicOrderTracking: vi.fn().mockResolvedValue({
    id: 42,
    orderNumber: "ANT-000042",
    status: "pendiente",
    shippingCarrier: "interrapidisimo",
    interrapidisimoGuide: null,
    createdAt: new Date(),
  }),
  updateOrderPaymentStatus: vi.fn().mockResolvedValue(undefined),
  getTestimonials: vi.fn().mockResolvedValue([{ id: 1, name: "Luis", comment: "Excelente", rating: 5, active: true, createdAt: new Date() }]),
  subscribeNewsletter: vi.fn().mockResolvedValue(undefined),
  getAdminStats: vi.fn().mockResolvedValue({ totalOrders: 5, totalRevenue: "1250000", pendingOrders: 2, totalProducts: 13 }),
  storagePut: vi.fn().mockResolvedValue({ url: "/manus-storage/test.png", key: "test.png" }),
  getPromoCarouselConfig: vi.fn().mockResolvedValue({
    intervalMs: 6000,
    slides: [{ id: "promo-1", mediaUrl: "/manus-storage/promo.mp4", mediaType: "video", ctaLabel: "Ver Colección", ctaHref: "/catalogo" }],
  }),
  updatePromoCarouselConfig: vi.fn().mockResolvedValue({ success: true }),
  getDeliveryPhotosConfig: vi.fn().mockResolvedValue({
    photos: [{ id: "delivery-1", imageUrl: "/manus-storage/delivery.jpg", alt: "Cliente feliz" }],
  }),
  updateDeliveryPhotosConfig: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "/manus-storage/test.png", key: "test.png" }),
}));

describe("categories router", () => {
  it("list returns categories for public users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({ name: "Cadenas", slug: "cadenas" });
  });

  it("listAll requires admin role", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.categories.listAll()).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    const result = await adminCaller.categories.listAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("products router", () => {
  it("list returns products publicly", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts the Niños perfumery filter", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await caller.products.list({ gender: "ninos" });
    expect(db.getProducts).toHaveBeenLastCalledWith({ gender: "ninos" });
  });

  it("getBySlug returns product with variants", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.getBySlug({ slug: "cadena-cubana" });
    expect(result).toMatchObject({ name: "Cadena Cubana", slug: "cadena-cubana" });
    expect(Array.isArray(result.variants)).toBe(true);
  });

  it("adminList requires admin role", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.products.adminList()).rejects.toThrow();
  });

  it("create product requires admin role", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.products.create({ name: "Test", slug: "test", basePrice: "100000", categoryId: 1 })).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    const result = await adminCaller.products.create({ name: "Test", slug: "test", basePrice: "100000", categoryId: 1 });
    expect(result).toMatchObject({ success: true });
  });

  it("allows administrators to save an optional previous price", async () => {
    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.products.create({
      name: "Producto en oferta",
      slug: "producto-en-oferta",
      basePrice: "135850",
      originalPrice: "143000",
      categoryId: 1,
    })).resolves.toMatchObject({ success: true });

    expect(db.createProduct).toHaveBeenLastCalledWith(expect.objectContaining({
      basePrice: "135850",
      originalPrice: "143000",
    }));
  });

  it("persists a previous price when an administrator updates a product", async () => {
    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.products.update({ id: 1, originalPrice: "143000" })).resolves.toMatchObject({ success: true });
    expect(db.updateProduct).toHaveBeenLastCalledWith(1, expect.objectContaining({ originalPrice: "143000" }));
  });

  it("allows administrators to save a manual product reference", async () => {
    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.products.create({
      name: "Cadena con referencia",
      slug: "cadena-con-referencia",
      basePrice: "250000",
      reference: "ANT-CAD-001",
      categoryId: 1,
    })).resolves.toMatchObject({ success: true });

    expect(db.createProduct).toHaveBeenLastCalledWith(expect.objectContaining({ reference: "ANT-CAD-001" }));
    await expect(adminCaller.products.update({ id: 1, reference: "ANT-CAD-002" })).resolves.toMatchObject({ success: true });
    expect(db.updateProduct).toHaveBeenLastCalledWith(1, expect.objectContaining({ reference: "ANT-CAD-002" }));
  });

  it("allows administrators to assign the Niños perfumery segment", async () => {
    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.products.create({
      name: "Fragancia infantil",
      slug: "fragancia-infantil",
      basePrice: "100000",
      categoryId: 1,
      gender: "ninos",
    })).resolves.toMatchObject({ success: true });
  });

  it("allows administrators to save several product materials", async () => {
    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    const materials = ["ORO 18K NACIONAL", "ESMERALDAS"];
    await expect(adminCaller.products.create({
      name: "Anillo con esmeralda",
      slug: "anillo-con-esmeralda",
      basePrice: "850000",
      categoryId: 1,
      materials,
    })).resolves.toMatchObject({ success: true });
    expect(db.createProduct).toHaveBeenLastCalledWith(expect.objectContaining({ materials }));
  });

  it("allows administrators to delete a product", async () => {
    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await adminCaller.products.delete({ id: 99 });
    expect(db.deleteProduct).toHaveBeenLastCalledWith(99);
  });
});

describe("promo carousel router", () => {
  const carousel = {
    intervalMs: 6000,
    slides: [{ id: "promo-1", mediaUrl: "/manus-storage/promo.mp4", mediaType: "video" as const, ctaLabel: "Ver Colección", ctaHref: "/catalogo" }],
  };

  it("returns the promotional carousel publicly", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.siteConfig.getPromoCarousel();
    expect(result.slides[0]).toMatchObject({ mediaType: "video", ctaLabel: "Ver Colección" });
  });

  it("requires admin access to update promotional carousel slides", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.siteConfig.updatePromoCarousel(carousel)).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.siteConfig.updatePromoCarousel(carousel)).resolves.toMatchObject({ success: true });
    expect(db.updatePromoCarouselConfig).toHaveBeenLastCalledWith(carousel);
  });
});

describe("delivery photos router", () => {
  const gallery = {
    photos: [{ id: "delivery-1", imageUrl: "/manus-storage/delivery.jpg", alt: "Cliente feliz" }],
  };

  it("returns delivery photos publicly", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.siteConfig.getDeliveryPhotos()).resolves.toMatchObject(gallery);
  });

  it("requires admin access to update delivery photos", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.siteConfig.updateDeliveryPhotos(gallery)).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.siteConfig.updateDeliveryPhotos(gallery)).resolves.toMatchObject({ success: true });
    expect(db.updateDeliveryPhotosConfig).toHaveBeenLastCalledWith(gallery);
  });
});

describe("promo codes router", () => {
  it("valida públicamente solo los códigos promocionales activos", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.promoCodes.validate({ code: "ahorra15" })).resolves.toEqual({ valid: true, code: "AHORRA15", discountPercent: 15 });
    vi.mocked(db.getActivePromoCode).mockResolvedValueOnce(undefined);
    await expect(caller.promoCodes.validate({ code: "INACTIVO" })).resolves.toEqual({ valid: false });
  });

  it("permite al administrador crear, editar y activar códigos", async () => {
    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.promoCodes.create({ code: "nuevo20", discountPercent: 20, active: true })).resolves.toMatchObject({ success: true });
    expect(db.createPromoCode).toHaveBeenLastCalledWith({ code: "nuevo20", discountPercent: 20, active: true });
    await expect(adminCaller.promoCodes.update({ id: 1, discountPercent: 25, active: false })).resolves.toMatchObject({ success: true });
    expect(db.updatePromoCode).toHaveBeenLastCalledWith(1, { discountPercent: 25, active: false });
  });

  it("restringe la administración de códigos a administradores", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.promoCodes.adminList()).rejects.toThrow();
  });
});

describe("orders router", () => {
  const wompiOrderInput = {
    total: "250000",
    subtotal: "250000",
    paymentMethod: "wompi" as const,
    shippingAddress: {
      fullName: "María García",
      address: "Calle 1 # 2-3",
      city: "Bogotá",
      department: "Cundinamarca",
      phone: "3001234567",
      notes: "Entregar antes de las 4 p. m.",
    },
    sessionId: "test-session",
    items: [{
      productId: 1,
      quantity: 1,
      unitPrice: "250000",
      productSnapshot: { name: "Cadena Cubana", material: "ORO 18K", imageUrl: "/cadena.jpg", reference: "ANT-CAD-001" },
    }],
  };

  it("crea un pedido Wompi con número y token público", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.orders.create(wompiOrderInput);
    expect(result).toMatchObject({ orderId: 42, orderNumber: "ANT-030101", paymentMethod: "wompi" });
    expect(db.createOrder).toHaveBeenLastCalledWith(expect.objectContaining({ paymentMethod: "wompi" }));
    expect(notifyTelegramAboutOrderMock).toHaveBeenLastCalledWith(expect.objectContaining({
      orderId: 42, orderNumber: "ANT-030101",
      paymentMethod: "wompi",
      customerName: "María García",
      customerPhone: "3001234567",
      notes: "Entregar antes de las 4 p. m.",
      total: "250000",
      items: wompiOrderInput.items,
    }));
  });

  it("crea un número de pedido también para pago contraentrega", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    vi.mocked(db.createOrder).mockResolvedValueOnce({ id: 42, publicToken: "pedido-publico-de-prueba-000000000001", orderNumber: "ANT-001001" });
    const result = await caller.orders.create({ ...wompiOrderInput, paymentMethod: "contraentrega" });
    expect(result).toMatchObject({ orderId: 42, orderNumber: "ANT-001001", paymentMethod: "contraentrega" });
    expect(db.createOrder).toHaveBeenLastCalledWith(expect.objectContaining({ paymentMethod: "contraentrega" }));
  });

  it("guarda el código y descuento verificados al crear un pedido", async () => {
    vi.mocked(db.calculateOrderPricing).mockResolvedValueOnce({
      subtotal: "250000", total: "162500", unitPrices: ["200000"], popupDiscountPercent: 20, popupDiscountAmount: "50000", promoCode: "AHORRA15", promoDiscountPercent: 15, promoDiscountAmount: "37500",
    });
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.orders.create({ ...wompiOrderInput, promoCode: "ahorra15" })).resolves.toMatchObject({ orderId: 42 });
    expect(db.createOrder).toHaveBeenLastCalledWith(expect.objectContaining({
      popupDiscountPercent: 20, popupDiscountAmount: "50000", promoCode: "AHORRA15", promoDiscountPercent: 15, promoDiscountAmount: "37500", total: "162500",
    }));
    expect(notifyTelegramAboutOrderMock).toHaveBeenLastCalledWith(expect.objectContaining({ popupDiscountPercent: 20, popupDiscountAmount: "50000", promoCode: "AHORRA15", promoDiscountAmount: "37500" }));
  });

  it("consulta la información pública de pago solo mediante token", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const token = "pedido-publico-de-prueba-000000000001";
    await expect(caller.orders.paymentInfo({ token })).resolves.toMatchObject({ id: 42, paymentMethod: "wompi" });
    expect(db.getOrderPaymentInfoByToken).toHaveBeenLastCalledWith(token);
  });

  it("marca el comprobante Wompi como enviado mediante su token público", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const token = "pedido-publico-de-prueba-000000000001";
    await expect(caller.orders.confirmWompiReceipt({ token })).resolves.toMatchObject({ orderId: 42, orderNumber: "ANT-000042" });
    expect(db.markWompiReceiptSent).toHaveBeenLastCalledWith(token);
  });

  it("myOrders requires authentication", async () => {
    const publicCaller = appRouter.createCaller(makePublicCtx());
    await expect(publicCaller.orders.myOrders()).rejects.toThrow();
  });

  it("authenticated user can get their orders", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.orders.myOrders();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getById returns order for owner", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.orders.getById({ id: 42 });
    expect(result).toMatchObject({ id: 42, status: "pendiente" });
  });

  it("adminList requires admin role", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.orders.adminList()).rejects.toThrow();
  });

  it("permite abrir un pedido administrativo por su consecutivo público", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.orders.adminGetByOrderNumber({ orderNumber: "ANT-030101" })).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.orders.adminGetByOrderNumber({ orderNumber: "ant-030101" })).resolves.toMatchObject({
      id: 42,
      orderNumber: "ANT-030101",
    });
    expect(db.getOrderByNumber).toHaveBeenLastCalledWith("ant-030101");
    expect(db.getOrderItems).toHaveBeenLastCalledWith(42);
  });

  it("updateStatus requires admin role", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.orders.updateStatus({ id: 1, status: "despachado" })).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.orders.updateStatus({ id: 1, status: "despachado" })).resolves.not.toThrow();
  });

  it("permite borrar pedidos solamente a administradores", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.orders.delete({ id: 42 })).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.orders.delete({ id: 42 })).resolves.not.toThrow();
    expect(db.deleteOrder).toHaveBeenLastCalledWith(42);
  });

  it("permite rastrear públicamente por número y gestionar la guía solo como admin", async () => {
    const publicCaller = appRouter.createCaller(makePublicCtx());
    await expect(publicCaller.orders.track({ orderNumber: "ANT-000042" })).resolves.toMatchObject({
      orderNumber: "ANT-000042",
      status: "pendiente",
      shippingCarrier: "interrapidisimo",
    });

    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.orders.updateShipment({ id: 1, status: "despachado", shippingCarrier: "coordinadora", interrapidisimoGuide: "123456789" })).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    await expect(adminCaller.orders.updateShipment({ id: 1, status: "despachado", shippingCarrier: "coordinadora", interrapidisimoGuide: "123456789" })).resolves.not.toThrow();
    expect(db.updateOrderShipment).toHaveBeenLastCalledWith(1, expect.objectContaining({ status: "despachado", shippingCarrier: "coordinadora", interrapidisimoGuide: "123456789" }));
  });
});

describe("testimonials router", () => {
  it("list returns testimonials publicly", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.testimonials.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({ name: "Luis", rating: 5 });
  });
});

describe("admin router", () => {
  it("stats requires admin role", async () => {
    const userCaller = appRouter.createCaller(makeCtx("user"));
    await expect(userCaller.admin.stats()).rejects.toThrow();

    const adminCaller = appRouter.createCaller(makeCtx("admin"));
    const stats = await adminCaller.admin.stats();
    expect(stats).toMatchObject({ totalOrders: 5, totalProducts: 13 });
  });
});

describe("auth.logout", () => {
  it("clears session cookie", async () => {
    const { ctx } = (() => {
      const clearedCookies: any[] = [];
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: (name: string, opts: any) => clearedCookies.push({ name, opts }) } as unknown as TrpcContext["res"],
      };
      return { ctx, clearedCookies };
    })();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
