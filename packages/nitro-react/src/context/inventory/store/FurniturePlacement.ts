import { FurniturePlacementError, FurnitureSpecialType } from '@nitrodevco/nitro-api';
import type { IFurnitureListItem } from '@nitrodevco/nitro-packets';

import { CanPlaceFurniture } from './FurnitureGrouping';
import type { IFurnitureGroupItem } from './IFurnitureGroupItem';

/**
 * `requestSelectedFurniPlacement` diverts these three straight to an
 * apply-decoration packet instead of handing them to the room mover - they are
 * never dragged onto a tile. Neither the composer nor its handler exists yet, so
 * the action stays closed rather than arming a ghost that can never land.
 */
const DECORATION_TYPES: readonly FurnitureSpecialType[] = [
    FurnitureSpecialType.WallPaper,
    FurnitureSpecialType.Floor,
    FurnitureSpecialType.Landscape
];

export const IsDecorationFurniture = (item: IFurnitureListItem | undefined) => !!item && DECORATION_TYPES.includes(item.category);

/**
 * `requestSelectedFurniToMover` hands the mover a legacy string instead of the
 * parsed stuff data for posters and external images, because both render off
 * that string rather than off a state.
 */
export const UsesLegacyStringPlacement = (item: IFurnitureListItem, isExternalImage: boolean) =>
    item.category === FurnitureSpecialType.Poster || isExternalImage;

/**
 * What the client knows about the room the item would land in. The server runs
 * the same ladder again in `RoomSecurityModule.CanPlaceFurniAsync`, so nothing
 * here is a security boundary - it decides what the UI offers.
 */
export type FurniturePlacementContext = {
    isInRoom: boolean;
    hasRoomRights: boolean;
};

/**
 * The guard ladder from `FurniModel.requestSelectedFurniPlacement`, kept free of
 * React so the room-rights half can grow guild and group-admin rules without
 * dragging a component render into it. First failing rung wins.
 */
export const GetFurniturePlacementError = (
    item: IFurnitureListItem | undefined,
    context: FurniturePlacementContext
): FurniturePlacementError => {
    if (!item) return FurniturePlacementError.NoItem;

    if (!context.isInRoom) return FurniturePlacementError.NotInRoom;

    if (!CanPlaceFurniture(item)) return FurniturePlacementError.RentedInRoom;

    if (IsDecorationFurniture(item)) return FurniturePlacementError.UnsupportedType;

    if (!context.hasRoomRights) return FurniturePlacementError.NoPermission;

    return FurniturePlacementError.None;
};


export type FurniturePlacementRun = { groupId: number; itemIds: number[] } | undefined;

/**
 * `GroupItem.peek` off the top of the stack, then `attemptPlaceNextFurni` walking
 * *down* it from the item just handed over - so a group of ten chairs places ten
 * times without reopening the strip. With no run in progress this is plain peek.
 *
 * The original tracks a `selectedItemIndex` and decrements it. This tracks the
 * ids already handed over instead, because the strip shrinks underneath us: the
 * `FurniListRemove` for a placed item can land either side of the local placed
 * event, and an index would then point at the wrong chair - or off the end.
 */
export const GetNextPlaceableFurniture = (
    group: IFurnitureGroupItem | undefined,
    run: FurniturePlacementRun
) => {
    if (!group) return undefined;

    // a run belongs to the stack it started on; anything else starts fresh
    const placed = new Set(run?.groupId === group.groupId ? run.itemIds : []);

    for (let index = group.items.length - 1; index >= 0; index--) {
        const item = group.items[index];

        if (!placed.has(item.itemId)) return item;
    }

    return undefined;
};
