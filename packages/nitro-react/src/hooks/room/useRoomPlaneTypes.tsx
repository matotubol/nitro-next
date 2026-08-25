import { useRoomDecorationSelector } from "#base/context";

/**
 * `FurniView.updateActionView` seeds its preview from the room the user is standing
 * in - `getRoomStringValue(activeRoomId, "room_floor_type")` and friends - so an
 * inventory preview is decorated like the room the furni would be placed into.
 *
 * These come off the room store rather than the room object's model: the model is not
 * reactive, so a caller reading it inside an effect captures whatever was set the last
 * time that effect happened to run and never sees a later repaint. The store is seeded
 * with the original's fallbacks (floor "101", wall "101", landscape "1.1") and reset
 * per room, so there is no undefined case to handle here.
 */
export const useRoomPlaneTypes = () => useRoomDecorationSelector();
