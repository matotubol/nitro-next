import { FurnitureSpecialType } from '@nitrodevco/nitro-api';
import type { IFurnitureListItem } from '@nitrodevco/nitro-packets';

import type { IFurnitureGroupItem } from './IFurnitureGroupItem';

/**
 * Grouping rules traced from `FurniModel.addOrUpdateItem` in the original client.
 * `groups` keeps the display order the strip was built in, `nextGroupId` hands
 * out the stable identity a group keeps for as long as it holds any item.
 */
export type FurnitureGroupState = {
    groups: IFurnitureGroupItem[];
    nextGroupId: number;
};

export const EmptyFurnitureGroupState = (): FurnitureGroupState => ({ groups: [], nextGroupId: 1 });

export const GetFurnitureGroupCount = (group: IFurnitureGroupItem) => group.items.length;

export const GetFurnitureGroupById = (state: FurnitureGroupState, groupId: number) => state.groups.find(x => x.groupId === groupId);

/**
 * `FurniView.setViewToState` only blocks placing when a *rented* item is already
 * standing in a room - an owned item keeps its flat id and stays placeable.
 */
export const CanPlaceFurniture = (item: IFurnitureListItem | undefined) => !!item && !(item.isRented && item.flatId > -1);

/**
 * `addOrUpdateItem` routes monsterplant seeds and chests down the groupable
 * path even when the item itself is not flagged groupable.
 */
const isGroupableCategory = (item: IFurnitureListItem) => item.isGroupable
    || item.category === FurnitureSpecialType.MonsterplantSeed
    || item.category === FurnitureSpecialType.FurniChest
    || item.category === FurnitureSpecialType.CoinsChest;

/**
 * Candidates always share sprite id and surface, so bucketing on that pair lets a
 * full strip rebuild stay linear instead of rescanning every group per item.
 */
type WorkingGroup = {
    source: IFurnitureGroupItem | undefined;
    changed: boolean;
    group: IFurnitureGroupItem;
};

const bucketKey = (spriteId: number, isWallItem: boolean) => `${spriteId}:${isWallItem ? 'i' : 's'}`;

const canGroupWith = (group: IFurnitureGroupItem, item: IFurnitureListItem) => {
    // Seeds only stack with seeds of the same rarity.
    if (item.category === FurnitureSpecialType.MonsterplantSeed) return group.stuffData.rarityLevel === item.stuffData.rarityLevel;

    if (!group.isGroupable) return false;

    // Posters stack per poster number, guild furni per full stuff data.
    if (item.category === FurnitureSpecialType.Poster) return group.stuffData.getLegacyString() === item.stuffData.getLegacyString();

    if (item.category === FurnitureSpecialType.GuildFurni) return item.stuffData.compare(group.stuffData);

    return true;
};

const toWorking = (groups: IFurnitureGroupItem[]) => {
    const working: WorkingGroup[] = groups.map(group => ({ source: group, changed: false, group }));
    const buckets = new Map<string, WorkingGroup[]>();

    for (const entry of working) {
        const key = bucketKey(entry.group.spriteId, entry.group.isWallItem);
        const bucket = buckets.get(key);

        if (bucket) bucket.push(entry);
        else buckets.set(key, [entry]);
    }

    return { working, buckets };
};

const toState = (working: WorkingGroup[], nextGroupId: number): FurnitureGroupState => ({
    // an untouched group keeps its object identity so its tile does not churn
    groups: working.filter(x => x.group.items.length).map(x => (x.changed || !x.source ? x.group : x.source)),
    nextGroupId
});

/**
 * `FurniModel.addOrUpdateItem(item, isFromList)`: an item that did not arrive with
 * the full strip counts as unseen, which paints the tile green and floats the
 * group to the head of the grid.
 */
const pushItem = (
    working: WorkingGroup[],
    buckets: Map<string, WorkingGroup[]>,
    item: IFurnitureListItem,
    nextGroupId: number,
    isUnseen: boolean
) => {
    const key = bucketKey(item.spriteId, item.isWallItem);
    const bucket = buckets.get(key) ?? [];

    if (!buckets.has(key)) buckets.set(key, bucket);

    const existing = isGroupableCategory(item)
        ? bucket.find(x => x.group.items.length && canGroupWith(x.group, item))
        : bucket.find(x => x.group.items.some(y => y.itemId === item.itemId));

    if (existing) {
        const index = existing.group.items.findIndex(x => x.itemId === item.itemId);
        const items = [...existing.group.items];

        if (index === -1) items.push(item);
        else items[index] = item;

        existing.group = { ...existing.group, items, hasUnseenItems: existing.group.hasUnseenItems || isUnseen };
        existing.changed = true;

        // `moveItemToTop`
        if (isUnseen) working.unshift(...working.splice(working.indexOf(existing), 1));

        return nextGroupId;
    }

    const entry: WorkingGroup = {
        source: undefined,
        changed: true,
        group: {
            groupId: nextGroupId,
            spriteId: item.spriteId,
            category: item.category,
            isWallItem: item.isWallItem,
            isGroupable: item.isGroupable,
            stuffData: item.stuffData,
            extra: item.extra,
            hasUnseenItems: isUnseen,
            items: [item]
        }
    };

    // `addItemToTop` / `addItemToBottom`
    if (isUnseen) working.unshift(entry);
    else working.push(entry);

    bucket.push(entry);

    return nextGroupId + 1;
};

export const AddOrUpdateFurnitureList = (state: FurnitureGroupState, items: IFurnitureListItem[]): FurnitureGroupState => {
    if (!items.length) return state;

    const { working, buckets } = toWorking(state.groups);

    let nextGroupId = state.nextGroupId;

    for (const item of items) nextGroupId = pushItem(working, buckets, item, nextGroupId, true);

    return toState(working, nextGroupId);
};

export const AddOrUpdateFurniture = (state: FurnitureGroupState, item: IFurnitureListItem): FurnitureGroupState =>
    AddOrUpdateFurnitureList(state, [item]);

export const RemoveFurnitureMultiple = (state: FurnitureGroupState, itemIds: number[]): FurnitureGroupState => {
    if (!itemIds.length) return state;

    const removing = new Set(itemIds);
    const groups: IFurnitureGroupItem[] = [];

    let changed = false;

    for (const group of state.groups) {
        const kept = group.items.filter(x => !removing.has(x.itemId));

        if (kept.length === group.items.length) {
            groups.push(group);

            continue;
        }

        changed = true;

        // An emptied group leaves the grid entirely.
        if (kept.length) groups.push({ ...group, items: kept });
    }

    return changed ? { ...state, groups } : state;
};

export const RemoveFurniture = (state: FurnitureGroupState, itemId: number): FurnitureGroupState =>
    RemoveFurnitureMultiple(state, [itemId]);

/**
 * `FurniModel.resetUnseenItems`: clears the green highlight once the strip has
 * actually been looked at.
 */
export const ClearUnseenFurniture = (state: FurnitureGroupState): FurnitureGroupState => {
    if (!state.groups.some(x => x.hasUnseenItems)) return state;

    return { ...state, groups: state.groups.map(x => (x.hasUnseenItems ? { ...x, hasUnseenItems: false } : x)) };
};

/**
 * `FurniModel.insertFurniture`: the full list is a diff against what is already
 * on the grid, so untouched groups - and the current selection - survive a reload.
 */
export const InsertFurnitureList = (state: FurnitureGroupState, items: IFurnitureListItem[]): FurnitureGroupState => {
    const incoming = new Set(items.map(x => x.itemId));
    const known = new Set<number>();
    const retained: IFurnitureGroupItem[] = [];

    for (const group of state.groups) {
        for (const item of group.items) known.add(item.itemId);

        const kept = group.items.filter(x => incoming.has(x.itemId));

        if (!kept.length) continue;

        retained.push(kept.length === group.items.length ? group : { ...group, items: kept });
    }

    const { working, buckets } = toWorking(retained);

    let nextGroupId = state.nextGroupId;

    for (const item of items) {
        if (known.has(item.itemId)) continue;

        nextGroupId = pushItem(working, buckets, item, nextGroupId, false);
    }

    return toState(working, nextGroupId);
};
