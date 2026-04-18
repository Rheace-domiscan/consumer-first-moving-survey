import { prisma } from "@/lib/prisma";

export async function recordAuditEvent(input: {
  surveyId: string;
  actorType: string;
  actorId?: string | null;
  eventType: string;
  payload?: unknown;
}) {
  return prisma.auditEvent.create({
    data: {
      surveyId: input.surveyId,
      actorType: input.actorType,
      actorId: input.actorId || null,
      eventType: input.eventType,
      payloadJson: input.payload ? JSON.stringify(input.payload) : null,
    },
  });
}
