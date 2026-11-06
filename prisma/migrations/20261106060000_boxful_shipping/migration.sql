-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "attemptedAt" TIMESTAMP(3),
ADD COLUMN     "boxfulSnapshot" JSONB,
ADD COLUMN     "creationState" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "labelUrl" TEXT,
ADD COLUMN     "lastErrorCode" TEXT,
ADD COLUMN     "shipmentNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;

-- CreateTable
CREATE TABLE "BoxfulSession" (
    "id" TEXT NOT NULL,
    "encryptedTokens" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoxfulSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoxfulLocation" (
    "id" TEXT NOT NULL,
    "accountScope" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,

    CONSTRAINT "BoxfulLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoxfulBalanceEntry" (
    "id" TEXT NOT NULL,
    "accountScope" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoxfulBalanceEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingAlert" (
    "id" TEXT NOT NULL,
    "accountScope" TEXT NOT NULL,
    "orderNumber" TEXT,
    "code" TEXT NOT NULL,
    "amountCents" INTEGER,
    "groupKey" TEXT NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "telegramSentAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoxfulLocation_accountScope_department_municipality_cityId_key" ON "BoxfulLocation"("accountScope", "department", "municipality", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentEvent_eventKey_key" ON "ShipmentEvent"("eventKey");

-- CreateIndex
CREATE INDEX "BoxfulBalanceEntry_accountScope_idx" ON "BoxfulBalanceEntry"("accountScope");

-- CreateIndex
CREATE INDEX "ShippingAlert_groupKey_idx" ON "ShippingAlert"("groupKey");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_externalId_key" ON "Shipment"("externalId");

-- AddForeignKey
ALTER TABLE "ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

