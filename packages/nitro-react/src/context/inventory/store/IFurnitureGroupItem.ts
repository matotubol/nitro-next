import type { FurnitureSpecialType, IObjectData } from '@nitrodevco/nitro-api';
import type { IFurnitureListItem } from '@nitrodevco/nitro-packets';

/**
 * A stack of inventory furniture the client displays as a single thumbnail.
 * Mirrors `GroupItem` in the original client: the group carries the shared
 * presentation data while `items` holds every strip id folded into it.
 */
export interface IFurnitureGroupItem {
    groupId: number;
    spriteId: number;
    category: FurnitureSpecialType;
    isWallItem: boolean;
    isGroupable: boolean;
    stuffData: IObjectData;
    extra: number;
    hasUnseenItems: boolean;
    items: IFurnitureListItem[];
}
