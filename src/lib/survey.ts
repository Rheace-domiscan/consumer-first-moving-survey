export const propertyTypes = [
  "Apartment",
  "House",
  "Bungalow",
  "Townhouse",
  "Storage unit",
  "Other",
] as const;

export const roomOptions = [
  "Living room",
  "Kitchen",
  "Dining room",
  "Primary bedroom",
  "Bedroom",
  "Bathroom",
  "Home office",
  "Garage",
  "Loft / attic",
  "Basement",
  "Shed / outbuilding",
] as const;

export type CreateSurveyPayload = {
  title?: string;
  originPostcode?: string;
  destinationPostcode?: string;
  propertyType?: string;
  moveWindow?: string;
  notes?: string;
  rooms: string[];
};

export function normalizeRooms(rooms: string[]) {
  return Array.from(new Set(rooms.map((room) => room.trim()).filter(Boolean)));
}
