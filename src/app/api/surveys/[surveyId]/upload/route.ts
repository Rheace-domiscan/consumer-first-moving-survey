import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToObjectStorage } from "@/lib/storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { surveyId } = await params;
  const formData = await request.formData();

  const roomId = formData.get("roomId");
  const file = formData.get("file");

  if (typeof roomId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "roomId and file are required." }, { status: 400 });
  }

  const room = await prisma.surveyRoom.findFirst({
    where: {
      id: roomId,
      surveyId,
      survey: {
        ownerClerkUserId: userId,
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const upload = await uploadToObjectStorage({
    fileName: file.name,
    contentType: file.type || undefined,
    buffer: Buffer.from(arrayBuffer),
  });

  const media = await prisma.surveyMedia.create({
    data: {
      surveyRoomId: room.id,
      kind: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
      fileName: file.name,
      contentType: file.type || null,
      fileSize: file.size,
      storageKey: upload.key,
      storageUrl: upload.url,
    },
  });

  await prisma.surveyRoom.update({
    where: { id: room.id },
    data: {
      mediaCount: {
        increment: 1,
      },
      status: "MEDIA_ATTACHED",
    },
  });

  await prisma.survey.updateMany({
    where: {
      id: surveyId,
      ownerClerkUserId: userId,
    },
    data: {
      status: "COLLECTING_MEDIA",
    },
  });

  return NextResponse.json(media, { status: 201 });
}
