import { InventoryCategoryEnum, InventoryMainFilterEnum, InventoryTypeFilterEnum } from '@nitrodevco/nitro-api';
import type { IFurnitureListItem } from '@nitrodevco/nitro-packets';
import { createStore } from 'zustand';

import { PreserveInventoryTypeFilter } from './FurnitureFilters';
import type { FurnitureGroupState } from './FurnitureGrouping';
import { AddOrUpdateFurnitureList, ClearUnseenFurniture, EmptyFurnitureGroupState, InsertFurnitureList, RemoveFurnitureMultiple } from './FurnitureGrouping';
import type { IFurnitureGroupItem } from './IFurnitureGroupItem';

type State = {
    initializedCategories: InventoryCategoryEnum[];
    furnitureGroups: IFurnitureGroupItem[];
    nextGroupId: number;
    selectedGroupId: number;
    mainFilter: InventoryMainFilterEnum;
    typeFilter: InventoryTypeFilterEnum;
    searchValue: string;
    /**
     * The repeated placement run in progress - `FurniModel`'s `§_-T17§` plus its
     * `selectedItemIndex` walk. Ids rather than an index so a strip update
     * mid-run cannot shift it, and scoped to a group so that emptying the last
     * stack cannot silently carry the run into whatever the strip falls back to.
     */
    placementRun: { groupId: number; itemIds: number[] } | undefined;
}

type Actions = {
    setCategoryInitialized: (category: InventoryCategoryEnum, initialized: boolean) => void;
    insertFurniture: (items: IFurnitureListItem[]) => void;
    addOrUpdateFurniture: (items: IFurnitureListItem[]) => void;
    removeFurniture: (itemId: number) => void;
    removeFurnitureMultiple: (itemIds: number[]) => void;
    invalidateFurniture: () => void;
    selectFurnitureGroup: (groupId: number) => void;
    clearUnseenFurniture: () => void;
    setMainFilter: (mainFilter: InventoryMainFilterEnum) => void;
    setTypeFilter: (typeFilter: InventoryTypeFilterEnum) => void;
    setSearchValue: (searchValue: string) => void;
    pushPlacementRun: (groupId: number, itemId: number) => void;
    clearPlacementRun: () => void;
}

const initialState: State = {
    initializedCategories: [],
    furnitureGroups: EmptyFurnitureGroupState().groups,
    nextGroupId: EmptyFurnitureGroupState().nextGroupId,
    selectedGroupId: -1,
    mainFilter: InventoryMainFilterEnum.All,
    typeFilter: InventoryTypeFilterEnum.Any,
    searchValue: '',
    placementRun: undefined
};

const toGroupState = (state: State): FurnitureGroupState => ({ groups: state.furnitureGroups, nextGroupId: state.nextGroupId });

/**
 * `FurniModel.selectFirstItem`: a selection that no longer exists falls back to
 * the head of the strip, so the preview never points at a discarded group.
 */
const fromGroupState = (state: State, next: FurnitureGroupState) => ({
    furnitureGroups: next.groups,
    nextGroupId: next.nextGroupId,
    selectedGroupId: next.groups.some(x => x.groupId === state.selectedGroupId)
        ? state.selectedGroupId
        : (next.groups[0]?.groupId ?? -1)
});

const withCategory = (categories: InventoryCategoryEnum[], category: InventoryCategoryEnum, initialized: boolean) => {
    if (categories.includes(category) === initialized) return categories;

    return initialized ? [...categories, category] : categories.filter(x => x !== category);
};

export type InventoryContextStore = State & Actions;

export const createInventoryContextStore = () => createStore<InventoryContextStore>()(set => ({
    ...initialState,
    setCategoryInitialized: (category: InventoryCategoryEnum, initialized: boolean) => set(x => ({
        initializedCategories: withCategory(x.initializedCategories, category, initialized)
    })),
    insertFurniture: (items: IFurnitureListItem[]) => set(x => ({
        ...fromGroupState(x, InsertFurnitureList(toGroupState(x), items)),
        initializedCategories: withCategory(x.initializedCategories, InventoryCategoryEnum.Furni, true)
    })),
    addOrUpdateFurniture: (items: IFurnitureListItem[]) => set(x => {
        // the original client drops these until the full list has landed, so a
        // partially built strip never gets treated as the complete inventory
        if (!x.initializedCategories.includes(InventoryCategoryEnum.Furni)) return {};

        return fromGroupState(x, AddOrUpdateFurnitureList(toGroupState(x), items));
    }),
    removeFurniture: (itemId: number) => set(x => fromGroupState(x, RemoveFurnitureMultiple(toGroupState(x), [itemId]))),
    removeFurnitureMultiple: (itemIds: number[]) => set(x => fromGroupState(x, RemoveFurnitureMultiple(toGroupState(x), itemIds))),
    invalidateFurniture: () => set(x => ({
        initializedCategories: withCategory(
            withCategory(x.initializedCategories, InventoryCategoryEnum.Furni, false),
            InventoryCategoryEnum.Rentables,
            false
        )
    })),
    // picking a different stack ends whatever run was going
    selectFurnitureGroup: (groupId: number) => set({ selectedGroupId: groupId, placementRun: undefined }),
    clearUnseenFurniture: () => set(x => fromGroupState(x, ClearUnseenFurniture(toGroupState(x)))),
    // switching placement keeps the type filter when the new list still offers it
    setMainFilter: (mainFilter: InventoryMainFilterEnum) => set(x => ({
        mainFilter,
        typeFilter: PreserveInventoryTypeFilter(mainFilter, x.typeFilter)
    })),
    setTypeFilter: (typeFilter: InventoryTypeFilterEnum) => set({ typeFilter }),
    setSearchValue: (searchValue: string) => set({ searchValue }),
    pushPlacementRun: (groupId: number, itemId: number) => set(x => ({
        placementRun: x.placementRun?.groupId === groupId
            ? { groupId, itemIds: [...x.placementRun.itemIds, itemId] }
            : { groupId, itemIds: [itemId] }
    })),
    clearPlacementRun: () => set(x => (x.placementRun ? { placementRun: undefined } : {}))
}));
