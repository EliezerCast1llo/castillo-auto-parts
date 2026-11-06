-- CreateTable
CREATE TABLE "ShippingAlertLease" (
    "id" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingAlertLease_pkey" PRIMARY KEY ("id")
);

