type ReadinessRoom = {
  status: string | null;
  mediaCount: number;
};

export function deriveReadinessState(rooms: ReadinessRoom[]) {
  if (rooms.length === 0) {
    return "NOT_READY" as const;
  }

  const completed = rooms.filter((room) => room.status === "COMPLETE").length;
  const withMedia = rooms.filter((room) => room.mediaCount > 0).length;

  if (completed === rooms.length && withMedia === rooms.length) {
    return "READY_FOR_SHARE" as const;
  }

  if (completed > 0 || withMedia > 0) {
    return "IN_PROGRESS" as const;
  }

  return "NOT_READY" as const;
}
