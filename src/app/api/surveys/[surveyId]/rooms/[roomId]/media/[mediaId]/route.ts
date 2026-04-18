import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { deriveSurveyStatus } from "@/lib/survey-status";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ surveyId: string; roomId: string; mediaId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { surveyId, roomId, mediaId } = await params;

  const media = await prisma.surveyMedia.findFirst({
    where: {
      id: mediaId,
      surveyRoomId: roomId,
      surveyRoom: {
        surveyId,
        survey: {
          ownerClerkUserId: userId,
        },
      },
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }

  if (
    process.env.STORAGE_BUCKET &&
    process.env.STORAGE_REGION &&
    process.env.STORAGE_ACCESS_KEY_ID &&
    process.env.STORAGE_SECRET_ACCESS_KEY &&
    process.env.STORAGE_ENDPOINT
  ) {
    const client = new S3Client({
      region: process.env.STORAGE_REGION,
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      },
    });

    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.STORAGE_BUCKET,
        Key: media.storageKey,
      }),
    );
  }

  await prisma.surveyMedia.delete({
    where: { id: media.id },
  });

  const remainingCount = await prisma.surveyMedia.count({
    where: {
      surveyRoomId: roomId,
    },
  });

  await prisma.surveyRoom.update({
    where: { id: roomId },
    data: {
      mediaCount: remainingCount,
      status: remainingCount > 0 ? "MEDIA_ATTACHED" : "AWAITING_CAPTURE",
    },
  });

  const rooms = await prisma.surveyRoom.findMany({
    where: {
      surveyId,
    },
    select: {
      status: true,
      mediaCount: true,
    },
  });

  await prisma.survey.update({
    where: { id: surveyId },
    data: {
      status: deriveSurveyStatus(rooms),
    },
  });

  return NextResponse.json({ ok: true });
}
