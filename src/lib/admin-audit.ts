import type { Prisma } from "@prisma/client";

export type AdminAuditInput = {
  action: string;
  entityId?: string;
  entityLabel?: string;
  entityType: string;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAdminAuditLog(
  tx: Prisma.TransactionClient,
  input: AdminAuditInput,
) {
  await tx.adminAuditLog.create({
    data: {
      action: input.action,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      entityType: input.entityType,
      metadata: input.metadata,
    },
  });
}
