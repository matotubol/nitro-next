import { InventoryMainFilterEnum, InventoryTypeFilterEnum } from "@nitrodevco/nitro-api";

import { useTranslation } from "#base/context";

/**
 * `FurniView.getMainFilterLabel` / `getTypeFilterLabel` resolve
 * `inventory.furni.filter.main|type.<id>`. Hotels whose texts predate those keys
 * still carry a few of the same labels under older ids, so each entry falls back
 * to its legacy key before the English default - that keeps the dropdowns
 * localized instead of forcing English on an out-of-date text file.
 */
type FilterLabel = {
    legacyKey?: string;
    fallback: string;
};

const MAIN_LABELS: Record<InventoryMainFilterEnum, FilterLabel> = {
    [InventoryMainFilterEnum.All]: { fallback: 'All' },
    [InventoryMainFilterEnum.FloorItems]: { legacyKey: 'inventory.furni.tab.floor', fallback: 'Floor items' },
    [InventoryMainFilterEnum.WallItems]: { legacyKey: 'inventory.furni.tab.wall', fallback: 'Wall items' },
    [InventoryMainFilterEnum.RoomLayout]: { fallback: 'Room layout' }
};

const TYPE_LABELS: Record<InventoryTypeFilterEnum, FilterLabel> = {
    [InventoryTypeFilterEnum.Any]: { legacyKey: 'inventory.filter.option.everything', fallback: 'Any type' },
    [InventoryTypeFilterEnum.Sittable]: { fallback: 'Sittable' },
    [InventoryTypeFilterEnum.Layable]: { fallback: 'Layable' },
    [InventoryTypeFilterEnum.TilesOrRugs]: { fallback: 'Tiles / Rugs' },
    [InventoryTypeFilterEnum.Ltd]: { fallback: 'LTD' },
    [InventoryTypeFilterEnum.Wired]: { legacyKey: 'product.design.wired', fallback: 'Wired' },
    [InventoryTypeFilterEnum.CreditFurni]: { legacyKey: 'product.design.credit_furni', fallback: 'Credit furni' },
    [InventoryTypeFilterEnum.Clothes]: { legacyKey: 'clothes', fallback: 'Clothes' },
    [InventoryTypeFilterEnum.PetFood]: { legacyKey: 'product.design.pet_food', fallback: 'Pet food' },
    [InventoryTypeFilterEnum.Collectibles]: { legacyKey: 'inventory.collectibles', fallback: 'Collectibles' },
    [InventoryTypeFilterEnum.Tradable]: { fallback: 'Tradable' },
    [InventoryTypeFilterEnum.NonTradable]: { fallback: 'Not tradable' },
    [InventoryTypeFilterEnum.Recyclable]: { fallback: 'Recyclable' },
    [InventoryTypeFilterEnum.Windows]: { legacyKey: 'product.design.windows', fallback: 'Windows' },
    [InventoryTypeFilterEnum.Dimmers]: { legacyKey: 'product.design.dimmers', fallback: 'Dimmers' },
    [InventoryTypeFilterEnum.Stickies]: { fallback: 'Stickies' },
    [InventoryTypeFilterEnum.Paintings]: { fallback: 'Paintings' },
    [InventoryTypeFilterEnum.Floors]: { legacyKey: 'catalog.spaces.tab.floors', fallback: 'Floors' },
    [InventoryTypeFilterEnum.Wallpapers]: { legacyKey: 'inventory.furni.item.wallpaper.name', fallback: 'Wallpapers' },
    [InventoryTypeFilterEnum.Landscape]: { legacyKey: 'inventory.furni.item.landscape.name', fallback: 'Landscape' }
};

export const useInventoryFurniFilterLabels = () => {
    const t = useTranslation();

    const resolve = (key: string, label: FilterLabel) =>
        t(key, label.legacyKey ? t(label.legacyKey, label.fallback) : label.fallback);

    const getMainFilterLabel = (filter: InventoryMainFilterEnum) =>
        resolve(`inventory.furni.filter.main.${filter}`, MAIN_LABELS[filter]);

    const getTypeFilterLabel = (filter: InventoryTypeFilterEnum) =>
        resolve(`inventory.furni.filter.type.${filter}`, TYPE_LABELS[filter]);

    return { getMainFilterLabel, getTypeFilterLabel };
};
