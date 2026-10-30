ALTER TABLE "Address" ADD COLUMN "landmark" TEXT;
ALTER TABLE "Shipment" ADD COLUMN "provider" TEXT,
 ADD COLUMN "courierId" TEXT, ADD COLUMN "courierName" TEXT,
 ADD COLUMN "serviceType" TEXT, ADD COLUMN "quotedCents" INTEGER,
 ADD COLUMN "chargedCents" INTEGER, ADD COLUMN "totalWeightGrams" INTEGER;
CREATE TABLE "ShippingPromotion" (
 "id" TEXT NOT NULL DEFAULT 'national', "enabled" BOOLEAN NOT NULL DEFAULT false,
 "minimumSubtotalCents" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ShippingPromotion_pkey" PRIMARY KEY ("id")
);
