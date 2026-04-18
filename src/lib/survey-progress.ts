export type ProgressRoom = {
  id: string;
  status: string | null;
  mediaCount: number;
};

export function getSurveyProgress(rooms: ProgressRoom[]) {
  const totalRooms = rooms.length;
  const completedRooms = rooms.filter((room) => room.status === "COMPLETE").length;
  const roomsWithMedia = rooms.filter((room) => room.mediaCount > 0).length;
  const percentComplete = totalRooms === 0 ? 0 : Math.round((completedRooms / totalRooms) * 100);

  return {
    totalRooms,
    completedRooms,
    roomsWithMedia,
    remainingRooms: Math.max(totalRooms - completedRooms, 0),
    percentComplete,
  };
}
