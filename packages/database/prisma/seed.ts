import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Point it at a PostgreSQL connection string.");
}
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// Standalone Firebase Admin init (not imported from @voltech/core) — this
// package has no dependency on @voltech/core, and core depends on
// @voltech/database, so importing core's copy here would be circular.
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set to seed demo accounts.");
}

// Same normalization as packages/core/src/firebase-admin.ts (duplicated,
// not imported, for the circular-dependency reason above) — handles
// escaped "\n", wrapping quotes, and \r\n, and fails loudly if the result
// still isn't a complete PEM block instead of a cryptic OpenSSL error.
function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
  if (!key.includes("-----BEGIN PRIVATE KEY-----") || !key.includes("-----END PRIVATE KEY-----")) {
    throw new Error("FIREBASE_PRIVATE_KEY doesn't look like a complete PEM key — re-paste the full private_key value from the service account JSON.");
  }
  return key;
}

const firebaseApp = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  }),
});
const firebaseAuth = getAuth(firebaseApp);

async function getOrCreateFirebaseUser(email: string, password: string, displayName: string) {
  try {
    return await firebaseAuth.getUserByEmail(email);
  } catch {
    return firebaseAuth.createUser({ email, password, displayName });
  }
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding VOLTECH marketplace...");

  // --- Platform: commission + shipping -------------------------------
  await db.commissionRule.upsert({
    where: { id: "global-commission" },
    update: { percentage: 8, active: true },
    create: { id: "global-commission", scope: "GLOBAL", percentage: 8, active: true },
  });

  const nairobiZone = await db.shippingZone.upsert({
    where: { id: "zone-nairobi" },
    update: {},
    create: {
      id: "zone-nairobi",
      name: "Nairobi Metro",
      countiesJson: JSON.stringify(["Nairobi"]),
      methods: {
        create: [
          { name: "Standard Delivery", carrier: "PLATFORM", fee: 200, estimatedDaysMin: 1, estimatedDaysMax: 3 },
          { name: "Express Delivery", carrier: "PLATFORM", fee: 450, estimatedDaysMin: 1, estimatedDaysMax: 1 },
        ],
      },
    },
  });

  await db.shippingZone.upsert({
    where: { id: "zone-nationwide" },
    update: {},
    create: {
      id: "zone-nationwide",
      name: "Nationwide",
      countiesJson: JSON.stringify(["Nationwide"]),
      methods: {
        create: [{ name: "Standard Delivery", carrier: "PLATFORM", fee: 450, estimatedDaysMin: 2, estimatedDaysMax: 6 }],
      },
    },
  });

  // --- Categories ------------------------------------------------------
  const categoryNames = [
    "Phones & Tablets",
    "Electronics",
    "Fashion",
    "Home & Living",
    "Beauty & Personal Care",
    "Computing",
  ];
  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const slug = slugify(name);
    const cat = await db.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, status: "ACTIVE" },
    });
    categories[name] = cat.id;
  }

  // --- Admin -------------------------------------------------------------
  const adminEmail = "admin@voltech.africa";
  const adminFirebaseUser = await getOrCreateFirebaseUser(adminEmail, "Admin123!", "VOLTECH Admin");
  const adminUser = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      firebaseUid: adminFirebaseUser.uid,
      fullName: "VOLTECH Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  await firebaseAuth.setCustomUserClaims(adminFirebaseUser.uid, { role: "SUPER_ADMIN", appUserId: adminUser.id });
  console.log(`Admin: ${adminEmail} / Admin123!`);

  // --- Demo seller ---------------------------------------------------
  const sellerEmail = "seller@voltech.africa";
  const sellerFirebaseUser = await getOrCreateFirebaseUser(sellerEmail, "Seller123!", "Jane Mwangi");
  const sellerUser = await db.user.upsert({
    where: { email: sellerEmail },
    update: {},
    create: {
      email: sellerEmail,
      firebaseUid: sellerFirebaseUser.uid,
      fullName: "Jane Mwangi",
      role: "SELLER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
  await firebaseAuth.setCustomUserClaims(sellerFirebaseUser.uid, { role: "SELLER", appUserId: sellerUser.id });
  const seller = await db.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      storeName: "Nairobi Gadgets",
      storeSlug: "nairobi-gadgets",
      storeDescription: "Quality electronics and accessories, shipped fast across Kenya.",
      status: "APPROVED",
      payoutMethod: "MPESA",
      payoutDetails: JSON.stringify({ phone: "254712345678" }),
    },
  });
  console.log(`Seller: ${sellerEmail} / Seller123!`);

  // --- Demo customer ---------------------------------------------------
  const customerEmail = "customer@voltech.africa";
  const customerFirebaseUser = await getOrCreateFirebaseUser(customerEmail, "Customer123!", "Amina Yusuf");
  const customerUser = await db.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      firebaseUid: customerFirebaseUser.uid,
      fullName: "Amina Yusuf",
      role: "CUSTOMER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      customerProfile: { create: {} },
      addresses: {
        create: {
          label: "Home",
          recipientName: "Amina Yusuf",
          phone: "254798765432",
          county: "Nairobi",
          city: "Nairobi",
          street: "Moi Avenue",
          isDefault: true,
        },
      },
    },
  });
  await firebaseAuth.setCustomUserClaims(customerFirebaseUser.uid, { role: "CUSTOMER", appUserId: customerUser.id });
  console.log(`Customer: ${customerEmail} / Customer123!`);

  // --- Demo products ---------------------------------------------------
  const existingProduct = await db.product.findUnique({ where: { slug: "aurora-wireless-earbuds" } });
  if (!existingProduct) {
    const product = await db.product.create({
      data: {
        sellerId: seller.id,
        categoryId: categories["Electronics"],
        name: "Aurora Wireless Earbuds",
        slug: "aurora-wireless-earbuds",
        description: "True wireless earbuds with active noise cancellation, 30-hour battery life with the charging case, and IPX5 water resistance.",
        specifications: JSON.stringify({ "Battery Life": "30 hours (with case)", Bluetooth: "5.3", "Water Resistance": "IPX5" }),
        basePrice: 4500,
        compareAtPrice: 6000,
        weightGrams: 60,
        warrantyInfo: "12-month seller warranty",
        shippingInfo: "Ships within 2 business days",
        status: "APPROVED",
        images: {
          create: [
            { url: "https://picsum.photos/seed/earbuds1/800/800", sortOrder: 0 },
            { url: "https://picsum.photos/seed/earbuds2/800/800", sortOrder: 1 },
          ],
        },
        variants: {
          create: [
            { sku: "AUR-EAR-BLK", optionsJson: JSON.stringify({ Color: "Black" }), price: 4500, compareAtPrice: 6000, status: "ACTIVE" },
            { sku: "AUR-EAR-WHT", optionsJson: JSON.stringify({ Color: "White" }), price: 4700, compareAtPrice: 6000, status: "ACTIVE" },
          ],
        },
      },
      include: { variants: true },
    });
    for (const v of product.variants) {
      await db.inventory.create({ data: { productId: product.id, variantId: v.id, onHand: 50 } });
    }

    const phone = await db.product.create({
      data: {
        sellerId: seller.id,
        categoryId: categories["Phones & Tablets"],
        name: "Nova X12 Smartphone",
        slug: "nova-x12-smartphone",
        description: "6.5-inch display, triple camera system, all-day battery. Available in three storage configurations.",
        specifications: JSON.stringify({ Display: "6.5\" AMOLED", Camera: "50MP Triple", Battery: "5000mAh" }),
        basePrice: 24999,
        compareAtPrice: 29999,
        weightGrams: 190,
        warrantyInfo: "12-month manufacturer warranty",
        shippingInfo: "Ships within 1 business day",
        status: "APPROVED",
        images: {
          create: [
            { url: "https://picsum.photos/seed/phone1/800/800", sortOrder: 0 },
            { url: "https://picsum.photos/seed/phone2/800/800", sortOrder: 1 },
          ],
        },
        variants: {
          create: [
            { sku: "NOVA-X12-128", optionsJson: JSON.stringify({ Storage: "128GB" }), price: 24999, compareAtPrice: 29999, status: "ACTIVE" },
            { sku: "NOVA-X12-256", optionsJson: JSON.stringify({ Storage: "256GB" }), price: 28999, compareAtPrice: 33999, status: "ACTIVE" },
          ],
        },
      },
      include: { variants: true },
    });
    for (const v of phone.variants) {
      await db.inventory.create({ data: { productId: phone.id, variantId: v.id, onHand: 30 } });
    }

    const shoes = await db.product.create({
      data: {
        sellerId: seller.id,
        categoryId: categories["Fashion"],
        name: "Savanna Running Shoes",
        slug: "savanna-running-shoes",
        description: "Lightweight breathable running shoes with cushioned sole, built for the daily commute or the morning run.",
        specifications: JSON.stringify({ Material: "Mesh upper, rubber sole" }),
        basePrice: 3200,
        status: "APPROVED",
        images: { create: [{ url: "https://picsum.photos/seed/shoes1/800/800", sortOrder: 0 }] },
        variants: {
          create: [
            { sku: "SAV-SHOE-40", optionsJson: JSON.stringify({ Size: "40" }), price: 3200, status: "ACTIVE" },
            { sku: "SAV-SHOE-42", optionsJson: JSON.stringify({ Size: "42" }), price: 3200, status: "ACTIVE" },
            { sku: "SAV-SHOE-44", optionsJson: JSON.stringify({ Size: "44" }), price: 3200, status: "ACTIVE" },
          ],
        },
      },
      include: { variants: true },
    });
    for (const v of shoes.variants) {
      await db.inventory.create({ data: { productId: shoes.id, variantId: v.id, onHand: 20 } });
    }

    console.log("Seeded 3 demo products for Nairobi Gadgets");
  }

  console.log(`Zones ready: ${nairobiZone.name} + Nationwide`);
  console.log("Done. Admin id:", adminUser.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
