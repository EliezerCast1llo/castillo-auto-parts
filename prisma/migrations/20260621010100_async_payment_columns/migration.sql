-- AlterTable
ALTER TABLE "Order" ADD COLUMN "reservationExpiresAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PAYMENT_PROCESSING';

-- CreateIndex
CREATE INDEX "Order_status_reservationExpiresAt_idx" ON "Order"("status", "reservationExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_provider_externalPaymentId_key" ON "Payment"("provider", "externalPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_provider_externalEventId_key" ON "PaymentEvent"("provider", "externalEventId");
