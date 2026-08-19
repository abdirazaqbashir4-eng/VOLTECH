import { db } from "@voltech/database";
import { notify, notifyAdmins } from "./notifications";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function submitSellerApplication(input: {
  userId: string;
  storeName: string;
  storeDescription: string;
  businessType: "INDIVIDUAL" | "REGISTERED_BUSINESS";
  businessRegistrationNumber?: string;
  idType: "NATIONAL_ID" | "PASSPORT";
  idNumber: string;
  idDocumentUrl: string;
  proofOfAddressUrl?: string;
  payoutMethod: "MPESA" | "BANK";
  payoutDetails: string;
}) {
  const existing = await db.sellerApplication.findFirst({
    where: { userId: input.userId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
  });
  if (existing) throw new Error("You already have a pending seller application");

  const alreadySeller = await db.sellerProfile.findUnique({ where: { userId: input.userId } });
  if (alreadySeller) throw new Error("You already have a seller account");

  const application = await db.sellerApplication.create({ data: { ...input, status: "SUBMITTED" } });

  await notifyAdmins(db, {
    type: "SELLER_APPLICATION_SUBMITTED",
    title: "New seller application",
    body: `${input.storeName} applied to become a seller.`,
    linkUrl: `/admin/sellers/applications/${application.id}`,
  });

  return application;
}

export async function decideSellerApplication(applicationId: string, reviewerId: string, decision: "APPROVED" | "REJECTED", notes?: string) {
  return db.$transaction(async (tx) => {
    const application = await tx.sellerApplication.findUniqueOrThrow({ where: { id: applicationId } });
    if (application.status === "APPROVED" || application.status === "REJECTED") {
      throw new Error("Application already decided");
    }

    await tx.sellerApplication.update({
      where: { id: applicationId },
      data: { status: decision, reviewedById: reviewerId, reviewNotes: notes, reviewedAt: new Date() },
    });

    if (decision === "APPROVED") {
      const baseSlug = slugify(application.storeName);
      let slug = baseSlug;
      let n = 1;
      while (await tx.sellerProfile.findUnique({ where: { storeSlug: slug } })) {
        slug = `${baseSlug}-${n++}`;
      }

      await tx.sellerProfile.create({
        data: {
          userId: application.userId,
          storeName: application.storeName,
          storeSlug: slug,
          storeDescription: application.storeDescription,
          status: "APPROVED",
          payoutMethod: application.payoutMethod,
          payoutDetails: application.payoutDetails,
        },
      });
      await tx.user.update({ where: { id: application.userId }, data: { role: "SELLER" } });
    }

    await notify(tx, {
      userId: application.userId,
      type: "SELLER_APPLICATION_DECIDED",
      title: decision === "APPROVED" ? "Seller application approved" : "Seller application rejected",
      body:
        decision === "APPROVED"
          ? `Congratulations — ${application.storeName} is now live on VOLTECH.`
          : `Your seller application was rejected.${notes ? ` Reason: ${notes}` : ""}`,
      linkUrl: decision === "APPROVED" ? "/seller/dashboard" : "/seller/apply",
    });

    return application;
  });
}

export async function setSellerStatus(sellerId: string, status: "APPROVED" | "SUSPENDED") {
  const seller = await db.sellerProfile.update({ where: { id: sellerId }, data: { status } });
  await notify(db, {
    userId: seller.userId,
    type: "SELLER_APPLICATION_DECIDED",
    title: status === "SUSPENDED" ? "Your store was suspended" : "Your store was reinstated",
    body: status === "SUSPENDED" ? "Contact support for details." : "Your store is active again.",
    linkUrl: "/seller/dashboard",
  });
  return seller;
}
