import { prisma } from "@/lib/prisma";
import { buildExtractionQueue, buildPlaceholderExtractionResult } from "@/lib/extraction";

export async function syncExtractionArtifactsForSurvey(surveyId: string) {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      rooms: {
        include: {
          media: true,
          extractionResults: true,
        },
      },
      extractionJobs: true,
    },
  });

  if (!survey) {
    throw new Error("Survey not found.");
  }

  const queue = buildExtractionQueue(
    survey.rooms.flatMap((room) =>
      room.media.map((media) => ({
        surveyId: survey.id,
        roomId: room.id,
        mediaId: media.id,
        kind: media.kind,
        fileName: media.fileName,
      })),
    ),
  );

  for (const item of queue) {
    const existingJob = survey.extractionJobs.find((job) => job.mediaId === item.mediaId);

    const job =
      existingJob ||
      (await prisma.extractionJob.create({
        data: {
          surveyId: item.surveyId,
          mediaId: item.mediaId,
          mode: item.extractionMode,
          status: "PENDING",
        },
      }));

    const room = survey.rooms.find((entry) => entry.id === item.roomId);
    if (!room) continue;

    const placeholder = buildPlaceholderExtractionResult({
      roomId: room.id,
      roomName: room.name,
      roomNotes: room.notes,
      mediaCount: room.mediaCount,
    });

    await prisma.extractionResult.upsert({
      where: {
        extractionJobId: job.id,
      },
      update: {
        surveyRoomId: room.id,
        needsReview: placeholder.needsReview,
        observedJson: JSON.stringify(placeholder.observedItems),
        declaredJson: JSON.stringify(placeholder.declaredItems),
      },
      create: {
        extractionJobId: job.id,
        surveyRoomId: room.id,
        needsReview: placeholder.needsReview,
        observedJson: JSON.stringify(placeholder.observedItems),
        declaredJson: JSON.stringify(placeholder.declaredItems),
      },
    });

    await prisma.extractionJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETE",
      },
    });
  }

  return prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      extractionJobs: {
        include: {
          result: true,
          media: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}
