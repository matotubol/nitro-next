import type { ISelectedRoomObjectData } from "@nitrodevco/nitro-api";
import { RoomObjectCategoryEnum, RoomObjectPlacementSource } from "@nitrodevco/nitro-api";
import type { StateCreator } from "zustand";

type State = {
    selectedAvatarId: number;
    selectedObjectId: number;
    selectedObjectCategory: RoomObjectCategoryEnum;
    selectedObject: ISelectedRoomObjectData | undefined;
    placedObject: ISelectedRoomObjectData | undefined;
    objectPlacementSource: RoomObjectPlacementSource;
    /**
     * `§_-11f§` / `§_-P2S§`: the type and facing of the last floor item put down
     * during a repeated placement run, so the next copy of the same item comes
     * out of the strip already turned the way the previous one ended up.
     */
    repeatedPlacement: { typeId: number; direction: number } | undefined;
}

type Actions = {
    getSelectedObject: () => ISelectedRoomObjectData | undefined;
    setSelectedAvatarId: (id: number) => void;
    setSelectedObjectId: (id: number) => void;
    setSelectedObjectCategory: (category: RoomObjectCategoryEnum) => void;
    setSelectedObject: (data: ISelectedRoomObjectData | undefined) => void;
    setPlacedObject: (data: ISelectedRoomObjectData | undefined) => void;
    setObjectPlacementSource: (source: RoomObjectPlacementSource) => void;
    setRepeatedPlacement: (data: { typeId: number; direction: number } | undefined) => void;
};

export const RoomSelectedObjectSliceInitialState: State = {
    selectedAvatarId: -1,
    selectedObjectId: -1,
    selectedObjectCategory: RoomObjectCategoryEnum.Minimum,
    selectedObject: undefined,
    placedObject: undefined,
    objectPlacementSource: RoomObjectPlacementSource.INVENTORY,
    repeatedPlacement: undefined
};

export type RoomSelectedObjectSlice = State & Actions;

export const createRoomSelectedObjectSlice: StateCreator<RoomSelectedObjectSlice, [], [], RoomSelectedObjectSlice> = (set, get, store) => ({
    ...RoomSelectedObjectSliceInitialState,
    getSelectedObject: () => get().selectedObject,
    setSelectedAvatarId: (id: number) => set({ selectedAvatarId: id }),
    setSelectedObjectId: (id: number) => set({ selectedObjectId: id }),
    setSelectedObjectCategory: (category: RoomObjectCategoryEnum) => set({ selectedObjectCategory: category }),
    setSelectedObject: (data: ISelectedRoomObjectData | undefined) => set({ selectedObject: data }),
    setPlacedObject: (data: ISelectedRoomObjectData | undefined) => set({ placedObject: data }),
    setObjectPlacementSource: (source: RoomObjectPlacementSource) => set({ objectPlacementSource: source }),
    setRepeatedPlacement: (data: { typeId: number; direction: number } | undefined) => set({ repeatedPlacement: data }),
});