import { MediaGallery } from "@/components/survey/media-gallery";
import { RoomActions } from "@/components/survey/room-actions";

type UploadRoomCardProps = {
  surveyId: string;
  room: {
    id: string;
    name: string;
    mediaCount: number;
    status: string | null;
    notes: string | null;
    media: {
      id: string;
      fileName: string;
      kind: string;
      createdAt: string | Date;
      storageUrl: string | null;
    }[];
  };
};

export function UploadRoomCard({ surveyId, room }: UploadRoomCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">{room.name}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {room.mediaCount} file{room.mediaCount === 1 ? "" : "s"} attached
          </p>
          <p className="mt-2 text-xs text-slate-300">{room.status || "Awaiting capture"}</p>
        </div>
        <RoomActions surveyId={surveyId} roomId={room.id} currentStatus={room.status} />
      </div>
      <div className="mt-4">
        <MediaGallery surveyId={surveyId} roomId={room.id} items={room.media} />
      </div>
    </div>
  );
}
