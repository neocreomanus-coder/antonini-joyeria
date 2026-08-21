import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

// Insert products
const productsData = [
  { name: "Cadena Cubana Oro 18K", slug: "cadena-cubana-oro-18k", description: "Cadena cubana de oro 18k con eslabones gruesos y acabado brillante. Ideal para uso diario o en ocasiones especiales.", material: "ORO 18K", basePrice: "250000", categoryId: 1, active: true, featured: true, imageUrls: JSON.stringify(["/manus-storage/cadena-cubana_a8a14386.png"]), stock: 15 },
  { name: "Cadena Ancla Oro 18K", slug: "cadena-ancla-oro-18k", description: "Cadena ancla de oro 18k con diseño marinero clásico. Perfecta para combinar con dijes o usar sola.", material: "ORO 18K", basePrice: "200000", categoryId: 1, active: true, featured: false, imageUrls: JSON.stringify(["/manus-storage/cadena-ancla_9ad97bc9.png"]), stock: 12 },
  { name: "Cadena Serpiente Oro 18K", slug: "cadena-serpiente-oro-18k", description: "Cadena serpiente de oro 18k con superficie lisa y flexible. Diseño elegante y sofisticado para mujer.", material: "ORO 18K", basePrice: "180000", categoryId: 1, active: true, featured: false, imageUrls: JSON.stringify(["/manus-storage/cadena-serpiente_1aa67271.png"]), stock: 10 },
  { name: "Dije Cruz Oro 18K", slug: "dije-cruz-oro-18k", description: "Dije cruz de oro 18k con acabado brillante. Símbolo de fe y protección. Compatible con cualquier cadena.", material: "ORO 18K", basePrice: "130000", categoryId: 2, active: true, featured: true, imageUrls: JSON.stringify(["/manus-storage/dije-cruz_9f68ca90.png"]), stock: 20 },
  { name: "Dije Corazon Oro 18K", slug: "dije-corazon-oro-18k", description: "Dije corazon de oro 18k, perfecto para regalar en ocasiones especiales. Diseño elegante y atemporal.", material: "ORO 18K", basePrice: "130000", categoryId: 2, active: true, featured: false, imageUrls: JSON.stringify(["/manus-storage/dije-corazon_832bb6f4.png"]), stock: 18 },
  { name: "Pulso Cubano Oro 18K", slug: "pulso-cubano-oro-18k", description: "Pulso cubano de oro 18k con eslabones gruesos. Resistente y elegante para uso diario.", material: "ORO 18K", basePrice: "150000", categoryId: 3, active: true, featured: true, imageUrls: JSON.stringify(["/manus-storage/pulso-cubano_0219c9ce.png"]), stock: 14 },
  { name: "Pulso Tennis Oro 18K", slug: "pulso-tennis-oro-18k", description: "Pulso tennis de oro 18k con piedras brillantes engastadas. Elegante y sofisticado para ocasiones especiales.", material: "ORO 18K", basePrice: "200000", categoryId: 3, active: true, featured: false, imageUrls: JSON.stringify(["/manus-storage/pulso-tennis_5dde6348.png"]), stock: 8 },
  { name: "Pulsera Balines Oro 18K", slug: "pulsera-balines-oro-18k", description: "Pulsera de balines de oro 18k para mujer. Delicada y femenina, perfecta para uso diario.", material: "ORO 18K", basePrice: "143000", categoryId: 4, active: true, featured: false, imageUrls: JSON.stringify(["/manus-storage/pulsera-balines_b988bfcc.png"]), stock: 16 },
  { name: "Brazalete Liso Oro 18K", slug: "brazalete-liso-oro-18k", description: "Brazalete liso de oro 18k con acabado pulido. Diseño minimalista y elegante para mujer.", material: "ORO 18K", basePrice: "200000", categoryId: 5, active: true, featured: true, imageUrls: JSON.stringify(["/manus-storage/brazalete-liso_897a85d3.png"]), stock: 10 },
  { name: "Anillo Sello Oro 18K", slug: "anillo-sello-oro-18k", description: "Anillo sello de oro 18k para hombre. Diseño clásico y masculino con acabado brillante.", material: "ORO 18K", basePrice: "150000", categoryId: 6, active: true, featured: false, imageUrls: JSON.stringify(["/manus-storage/anillo-sello_f5e9e942.png"]), stock: 12 },
  { name: "Anillo Diamante Oro 18K", slug: "anillo-diamante-oro-18k", description: "Anillo solitario de oro 18k con diamante brillante. Perfecto para compromiso o regalo especial.", material: "ORO 18K", basePrice: "350000", categoryId: 6, active: true, featured: true, imageUrls: JSON.stringify(["/manus-storage/anillo-diamante_80f78a08.png"]), stock: 6 },
  { name: "Argollas Matrimonio Oro 18K", slug: "argollas-matrimonio-oro-18k", description: "Par de argollas de matrimonio en oro 18k. Diseño clásico y atemporal para el dia mas especial.", material: "ORO 18K", basePrice: "300000", categoryId: 7, active: true, featured: true, imageUrls: JSON.stringify(["/manus-storage/argolla-matrimonio_a95a8b3c.png"]), stock: 8 },
  { name: "Set Regalo Joyeria Oro 18K", slug: "set-regalo-joyeria-oro-18k", description: "Set de regalo de joyeria en oro 18k que incluye cadena y dije. Presentacion en caja de lujo.", material: "ORO 18K", basePrice: "380000", categoryId: 8, active: true, featured: true, imageUrls: JSON.stringify(["/manus-storage/regalo-set_f4e31dd3.png"]), stock: 5 },
];

for (const p of productsData) {
  try {
    await conn.execute(
      `INSERT IGNORE INTO products (name, slug, description, material, basePrice, categoryId, active, featured, imageUrls, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.slug, p.description, p.material, p.basePrice, p.categoryId, p.active, p.featured, p.imageUrls, p.stock]
    );
    console.log("Inserted:", p.name);
  } catch (e) {
    console.error("Error inserting", p.name, e.message);
  }
}

// Insert variants for chains
const chainProducts = await conn.execute("SELECT id, slug FROM products WHERE categoryId = 1");
for (const chain of chainProducts[0]) {
  const lengths = ["40cm", "45cm", "50cm", "55cm", "60cm"];
  for (const len of lengths) {
    try {
      await conn.execute(
        `INSERT IGNORE INTO product_variants (productId, type, value, priceModifier, stock, active) VALUES (?, 'length', ?, ?, ?, true)`,
        [chain.id, len, len === "55cm" || len === "60cm" ? "20000" : "0", 10]
      );
    } catch (e) {}
  }
}

// Insert variants for rings
const ringProducts = await conn.execute("SELECT id FROM products WHERE categoryId = 6");
for (const ring of ringProducts[0]) {
  const sizes = ["6", "7", "8", "9", "10", "11", "12"];
  for (const sz of sizes) {
    try {
      await conn.execute(
        `INSERT IGNORE INTO product_variants (productId, type, value, priceModifier, stock, active) VALUES (?, 'size', ?, '0', ?, true)`,
        [ring.id, sz, 8]
      );
    } catch (e) {}
  }
}

// Insert testimonials
const testimonials = [
  { name: "Luis Enrique", comment: "Excelente producto, su material es de gran calidad. Lo recomiendo 100%.", rating: 5 },
  { name: "Alejandra M.", comment: "Excelente calidad y diseño. Llegó muy bien empacado y en perfecto estado. Definitivamente volvería a comprar.", rating: 5 },
  { name: "Carlos Mario", comment: "Maravillosos y bonitos los productos. Mil felicitaciones por tan magnifica empresa.", rating: 5 },
  { name: "Karen P.", comment: "Excelente calidad, muy cómoda y demasiado hermosa. 100% lo recomiendo para detalles y regalos.", rating: 5 },
  { name: "Fernando R.", comment: "El producto me gustó mucho, igual al de la publicación. 100% recomendado.", rating: 5 },
  { name: "Juan Manuel", comment: "Son los mejores 100% recomendados. Ya tengo dos joyas, con la primera llevo 4 años y está intacta.", rating: 5 },
  { name: "Claudia V.", comment: "Me parece muy buen producto, lo recomiendo. No es la primera vez que compro y siempre me ha ido muy bien.", rating: 5 },
  { name: "Sergio T.", comment: "Excelente producto 100% lo recomiendo. Llegó antes de lo esperado y en perfectas condiciones.", rating: 5 },
];

for (const t of testimonials) {
  try {
    await conn.execute(
      `INSERT IGNORE INTO testimonials (name, comment, rating, active) VALUES (?, ?, ?, true)`,
      [t.name, t.comment, t.rating]
    );
    console.log("Inserted testimonial:", t.name);
  } catch (e) {
    console.error("Error inserting testimonial", t.name, e.message);
  }
}

console.log("Seed completed!");
await conn.end();
