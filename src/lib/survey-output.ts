type OutputRoom = {
  id: string;
  name: string;
  status: string | null;
  mediaCount: number;
  notes: string | null;
};

type OutputSurvey = {
  id: string;
  title: string | null;
  propertyType: string | null;
  originPostcode: string | null;
  destinationPostcode: string | null;
  moveWindow: string | null;
  notes: string | null;
  rooms: OutputRoom[];
};

export function buildQuoteReadySummary(survey: OutputSurvey) {
  const completedRooms = survey.rooms.filter((room) => room.status === "COMPLETE");
  const roomsWithMedia = survey.rooms.filter((room) => room.mediaCount > 0);

  return {
    surveyTitle: survey.title || "Untitled draft survey",
    moveContext: {
      propertyType: survey.propertyType || "Pending",
      originPostcode: survey.originPostcode || "Pending",
      destinationPostcode: survey.destinationPostcode || "Pending",
      moveWindow: survey.moveWindow || "Pending",
    },
    completeness: {
      totalRooms: survey.rooms.length,
      completedRooms: completedRooms.length,
      roomsWithMedia: roomsWithMedia.length,
      readyForMoverPreview: completedRooms.length > 0 && roomsWithMedia.length > 0,
    },
    roomSummaries: survey.rooms.map((room) => ({
      id: room.id,
      name: room.name,
      status: room.status || "AWAITING_CAPTURE",
      mediaCount: room.mediaCount,
      notes: room.notes || null,
    })),
    moverPreview: {
      structuredInventoryStatus:
        completedRooms.length === survey.rooms.length && survey.rooms.length > 0
          ? "READY_FOR_FIRST_REVIEW"
          : "PARTIAL_DRAFT",
      notesForMover: survey.notes || null,
    },
  };
}
