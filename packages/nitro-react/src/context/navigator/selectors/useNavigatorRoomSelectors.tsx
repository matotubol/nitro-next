import { useShallow } from "zustand/shallow";

import { useNavigatorContext } from "../useNavigatorContext";

/** Everything about the room we are in, or about to be in. */
export const useNavigatorRoomSelectors = () => useNavigatorContext(useShallow(x => ({
    enteredRoom: x.enteredRoom,
    currentRoomId: x.currentRoomId,
    currentRoomIsOwner: x.currentRoomIsOwner,
    currentRoomRating: x.currentRoomRating,
    canRateCurrentRoom: x.canRateCurrentRoom,
    isCurrentRoomStaffPick: x.isCurrentRoomStaffPick,
    homeRoomId: x.homeRoomId,
    favouriteRoomIds: x.favouriteRoomIds,
    favouriteLimit: x.favouriteLimit
})));

export const useNavigatorInfoRoom = () => useNavigatorContext(x => x.infoRoom);

export const useNavigatorInfoRoomAnchor = () => useNavigatorContext(x => x.infoRoomAnchor);

export const useNavigatorDoorData = () => useNavigatorContext(x => x.doorData);

export const useNavigatorDoorbellKnocks = () => useNavigatorContext(x => x.doorbellKnocks);

export const useNavigatorRoomSettingsData = () => useNavigatorContext(x => x.roomSettingsData);

export const useNavigatorRoomSettingsError = () => useNavigatorContext(x => x.roomSettingsError);

export const useIsFavouriteRoom = (roomId: number) =>
    useNavigatorContext(x => x.favouriteRoomIds.indexOf(roomId) >= 0);

export const useNavigatorCreatorSelectors = () => useNavigatorContext(useShallow(x => ({
    isCreatorOpen: x.isCreatorOpen,
    flatCategories: x.flatCategories,
    canCreateRoom: x.canCreateRoom,
    createdRoomLimit: x.createdRoomLimit
})));
