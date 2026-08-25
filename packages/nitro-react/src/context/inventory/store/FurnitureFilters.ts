import { FurnitureSpecialType, IFurnitureData, InventoryMainFilterEnum, InventoryTypeFilterEnum } from '@nitrodevco/nitro-api';

import type { IFurnitureGroupItem } from './IFurnitureGroupItem';

/**
 * Filter ids and predicates traced from `FurniView.MAIN_FILTER_IDS` and the
 * `FurniGridView.passFilter` helper in the original client.
 */
export const INVENTORY_MAIN_FILTERS: InventoryMainFilterEnum[] = [
    InventoryMainFilterEnum.All,
    InventoryMainFilterEnum.FloorItems,
    InventoryMainFilterEnum.WallItems,
    InventoryMainFilterEnum.RoomLayout
];

// the original list carries a `collectibles` entry gated on `GroupItem.isNft()`;
// this client has no NFT model, so the option is left out rather than shipped dead
const FLOOR_TYPE_FILTERS: InventoryTypeFilterEnum[] = [
    InventoryTypeFilterEnum.Any,
    InventoryTypeFilterEnum.Sittable,
    InventoryTypeFilterEnum.Layable,
    InventoryTypeFilterEnum.TilesOrRugs,
    InventoryTypeFilterEnum.Ltd,
    InventoryTypeFilterEnum.Wired,
    InventoryTypeFilterEnum.CreditFurni,
    InventoryTypeFilterEnum.Clothes,
    InventoryTypeFilterEnum.PetFood,
    InventoryTypeFilterEnum.Tradable,
    InventoryTypeFilterEnum.NonTradable,
    InventoryTypeFilterEnum.Recyclable
];

const WALL_TYPE_FILTERS: InventoryTypeFilterEnum[] = [
    InventoryTypeFilterEnum.Any,
    InventoryTypeFilterEnum.Windows,
    InventoryTypeFilterEnum.Dimmers,
    InventoryTypeFilterEnum.Stickies,
    InventoryTypeFilterEnum.Paintings,
    InventoryTypeFilterEnum.Tradable,
    InventoryTypeFilterEnum.NonTradable,
    InventoryTypeFilterEnum.Recyclable
];

const ROOM_LAYOUT_TYPE_FILTERS: InventoryTypeFilterEnum[] = [
    InventoryTypeFilterEnum.Any,
    InventoryTypeFilterEnum.Floors,
    InventoryTypeFilterEnum.Wallpapers,
    InventoryTypeFilterEnum.Landscape
];

/**
 * `FurniView.getTypeFilterIds`: the type list depends on the placement filter.
 */
export const GetInventoryTypeFilters = (main: InventoryMainFilterEnum): InventoryTypeFilterEnum[] => {
    switch (main) {
        case InventoryMainFilterEnum.WallItems:
            return WALL_TYPE_FILTERS;
        case InventoryMainFilterEnum.RoomLayout:
            return ROOM_LAYOUT_TYPE_FILTERS;
        default:
            return FLOOR_TYPE_FILTERS;
    }
};

/**
 * `FurniView.getPreservedTypeFilter`: switching placement keeps the current type
 * when the new list still offers it, otherwise it falls back to `any`.
 */
export const PreserveInventoryTypeFilter = (main: InventoryMainFilterEnum, type: InventoryTypeFilterEnum): InventoryTypeFilterEnum =>
    GetInventoryTypeFilters(main).includes(type) ? type : InventoryTypeFilterEnum.Any;

const isRoomLayout = (group: IFurnitureGroupItem) =>
    group.category === FurnitureSpecialType.WallPaper
    || group.category === FurnitureSpecialType.Floor
    || group.category === FurnitureSpecialType.Landscape;

const isTilesOrRugs = (data: IFurnitureData) => {
    if (data.className.startsWith('tile_walkmagic') || data.className === 'hole') return false;

    if (data.category === 'rug' || data.category === 'floor') return true;

    if (data.className.startsWith('carpet')) return true;

    // the original also requires `canPutStuffOn` and a height under 0.2; furni data
    // in this client carries neither, so the remaining shape checks stand in
    return data.canStandOn && data.tileSizeX > 1 && data.tileSizeY > 1;
};

const passesMainFilter = (group: IFurnitureGroupItem, main: InventoryMainFilterEnum) => {
    switch (main) {
        case InventoryMainFilterEnum.FloorItems:
            return !group.isWallItem;
        case InventoryMainFilterEnum.WallItems:
            return group.isWallItem && !isRoomLayout(group);
        case InventoryMainFilterEnum.RoomLayout:
            return isRoomLayout(group);
        default:
            return true;
    }
};

const passesTypeFilter = (group: IFurnitureGroupItem, data: IFurnitureData | undefined, type: InventoryTypeFilterEnum) => {
    const item = group.items[group.items.length - 1];

    switch (type) {
        case InventoryTypeFilterEnum.Sittable:
            return !!data?.canSitOn;
        case InventoryTypeFilterEnum.Layable:
            return !!data?.canLayOn;
        case InventoryTypeFilterEnum.TilesOrRugs:
            return !!data && isTilesOrRugs(data);
        case InventoryTypeFilterEnum.Ltd:
            return item.stuffData.uniqueNumber > 0;
        case InventoryTypeFilterEnum.Wired:
            return !!data && (data.className.startsWith('wf_') || data.category.startsWith('wired_'));
        case InventoryTypeFilterEnum.CreditFurni:
            return group.category === FurnitureSpecialType.CreditFurni || !!data?.className.startsWith('CF_');
        case InventoryTypeFilterEnum.Clothes:
            return group.category === FurnitureSpecialType.FigurePurchasableSet;
        case InventoryTypeFilterEnum.PetFood:
            return !!data && (data.className.startsWith('petfood') || data.furniLine === 'pet_food');
        case InventoryTypeFilterEnum.Tradable:
            return item.isTradeable;
        case InventoryTypeFilterEnum.NonTradable:
            return !item.isTradeable;
        case InventoryTypeFilterEnum.Recyclable:
            return item.isRecyclable;
        case InventoryTypeFilterEnum.Windows:
            return !!data && (data.className.startsWith('window_') || data.furniLine === 'windows' || data.category === 'window');
        case InventoryTypeFilterEnum.Dimmers:
            return !!data && (data.className.startsWith('dimmer_') || data.category === 'dimmer' || data.furniLine === 'dimmers');
        case InventoryTypeFilterEnum.Stickies:
            return group.category === FurnitureSpecialType.PostIt;
        case InventoryTypeFilterEnum.Paintings:
            return !!data?.className.startsWith('diamond_painting');
        case InventoryTypeFilterEnum.Floors:
            return group.category === FurnitureSpecialType.Floor;
        case InventoryTypeFilterEnum.Wallpapers:
            return group.category === FurnitureSpecialType.WallPaper;
        case InventoryTypeFilterEnum.Landscape:
            return group.category === FurnitureSpecialType.Landscape;
        default:
            return true;
    }
};

/**
 * `FurniGridView.passFilter`: placement, then type, then the free-text search that
 * matches on the localized name or description.
 */
export const PassesInventoryFilter = (
    group: IFurnitureGroupItem,
    data: IFurnitureData | undefined,
    main: InventoryMainFilterEnum,
    type: InventoryTypeFilterEnum,
    search: string,
    name: string,
    description: string
) => {
    if (!passesMainFilter(group, main)) return false;

    if (!passesTypeFilter(group, data, type)) return false;

    if (!search.length) return true;

    return name.toLowerCase().includes(search) || description.toLowerCase().includes(search);
};
