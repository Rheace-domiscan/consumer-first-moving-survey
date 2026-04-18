type StatusRoom = {
  status: string | null;
  mediaCount: number;
};

export function deriveSurveyStatus(rooms: StatusRoom[]) {
  if (rooms.length === 0) {
    return "DRAFT" as const;
  }

  const completedRooms = rooms.filter((room) => room.status === "COMPLETE").length;
  const roomsWithMedia = rooms.filter((room) => room.mediaCount > 0).length;

  if (completedRooms === rooms.length) {
    return "READY_TO_SHARE" as const;
  }

  if (roomsWithMedia > 0) {
    return "COLLECTING_MEDIA" as const;
  }

  return "DRAFT" as const;
}
