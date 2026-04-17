import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRooms, type CreateSurveyPayload } from "@/lib/survey";

export async function GET() {
  const surveys = await prisma.survey.findMany({
    include: {
      rooms: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(surveys);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSurveyPayload;
  const rooms = normalizeRooms(body.rooms ?? []);

  if (rooms.length === 0) {
    return NextResponse.json({ error: "At least one room is required." }, { status: 400 });
  }

  const survey = await prisma.survey.create({
    data: {
      title: body.title?.trim() || null,
      originPostcode: body.originPostcode?.trim() || null,
      destinationPostcode: body.destinationPostcode?.trim() || null,
      propertyType: body.propertyType?.trim() || null,
      moveWindow: body.moveWindow?.trim() || null,
      notes: body.notes?.trim() || null,
      rooms: {
        create: rooms.map((name) => ({ name })),
      },
    },
    include: {
      rooms: true,
    },
  });

  return NextResponse.json(survey, { status: 201 });
}
