import { FurnitureSpecialType, RoomId, Vector3d } from "@nitrodevco/nitro-api";
import type { IFurnitureListItem } from "@nitrodevco/nitro-packets";
import { RefObject, useEffect, useState } from "react";

import type { IFurnitureGroupItem } from "#base/context";
import { useFurnitureDataSelector } from "#base/context";

import { useRoomPlaneTypes } from "../room/useRoomPlaneTypes";
import { useRoomPreviewer } from "../room/useRoomPreviewer";

/**
 * `FurniView.updateActionView` drives the `room_previewer` widget the inventory
 * layout declares at `preview_container/furni_preview_widget` (170x130, with
 * `furni_preview_region` sitting over it to take the click). The widget shows the
 * item standing in a room decorated like the one the user is in - not a flat icon.
 */
export type InventoryFurniPreviewMode =
    | 'none'
    | 'floor-item'
    | 'wall-item'
    | 'room-surface';

/** The plane a wallpaper/floor/landscape item repaints instead of being placed. */
const ROOM_SURFACE_CATEGORIES = [
    FurnitureSpecialType.WallPaper,
    FurnitureSpecialType.Floor,
    FurnitureSpecialType.Landscape
];

/**
 * `getFurnitureDataByName("ads_twi_windw", "i")`: a landscape is only visible
 * through a window, so the original hangs one on the wall to preview it.
 */
const LANDSCAPE_WINDOW_CLASS_NAME = 'ads_twi_windw';

const PREVIEW_DIRECTION = new Vector3d(90, 0, 0);

const getPreviewMode = (group: IFurnitureGroupItem | undefined): InventoryFurniPreviewMode => {
    if (!group) return 'none';

    if (ROOM_SURFACE_CATEGORIES.includes(group.category)) return 'room-surface';

    return group.isWallItem ? 'wall-item' : 'floor-item';
}

/**
 * `selectedItemIndex`: which strip entry the preview points at. Only photos ever
 * move it - `showNextPreviewItem` walks the stack so each shot can be seen - and
 * `GroupItem`'s setter wraps back to 0 past the end. Held per group so switching
 * groups starts at the top of the new stack, the original's -1 reset.
 */
type PreviewSelection = {
    groupId: number;
    index: number;
};

/** `GroupItem.peek` - the top of the stack, which a -1 index falls back to. */
const peek = (group: IFurnitureGroupItem) => group.items[group.items.length - 1];

const getPreviewItem = (
    group: IFurnitureGroupItem | undefined,
    selection: PreviewSelection
): IFurnitureListItem | undefined => {
    if (!group || !group.items.length) return undefined;

    if (selection.groupId !== group.groupId || selection.index < 0) return peek(group);

    return group.items[selection.index] ?? peek(group);
}

export const useInventoryFurniPreview = (
    group: IFurnitureGroupItem | undefined,
    canvasRef: RefObject<HTMLCanvasElement | null>
) => {
    const previewMode = getPreviewMode(group);
    const [selection, setSelection] = useState<PreviewSelection>({ groupId: -1, index: -1 });
    const { wallItems } = useFurnitureDataSelector();
    const { floorType, wallType, landscapeType } = useRoomPlaneTypes();
    const {
        isReady,
        canRotate,
        addFurnitureIntoRoom,
        addWallItemIntoRoom,
        resetRoomPreview,
        rotatePreviewObject,
        changePreviewObjectState,
        updateRoomPreviewPlaneTypes,
        updateRoomPreviewPlaneVisibility
    } = useRoomPreviewer(RoomId.TEMP_ROOM_INVENTORY, canvasRef);

    const previewItem = getPreviewItem(group, selection);

    // `getWallItemType(item.type) == "external_image_wallitem"` - photos, which are
    // the only items whose stack is worth stepping through one entry at a time
    const isPhotoItem = !!group?.isWallItem && !!wallItems[group.spriteId]?.isExternalImage;

    useEffect(() => {
        if (!isReady) return;

        if (!group || !previewItem) {
            resetRoomPreview(false);
            return;
        }

        switch (previewMode) {
            case 'room-surface': {
                // the item repaints one plane; the other two stay as the room has them
                const legacyString = group.stuffData.getLegacyString();

                resetRoomPreview(false);
                updateRoomPreviewPlaneVisibility(true, true);
                updateRoomPreviewPlaneTypes(
                    group.category === FurnitureSpecialType.Floor ? legacyString : floorType,
                    group.category === FurnitureSpecialType.WallPaper ? legacyString : wallType,
                    group.category === FurnitureSpecialType.Landscape ? legacyString : landscapeType
                );

                if (group.category === FurnitureSpecialType.Landscape) {
                    const window = Object.values(wallItems).find(x => x.className === LANDSCAPE_WINDOW_CLASS_NAME);

                    if (window) addWallItemIntoRoom(window.id, PREVIEW_DIRECTION, window.customParams);
                }

                break;
            }
            case 'wall-item':
                updateRoomPreviewPlaneTypes(floorType, wallType, landscapeType);
                updateRoomPreviewPlaneVisibility(true, true);
                // posters and photos both ride the legacy string - the poster number
                // or the photo's data - and it comes off the *selected* item, not the
                // group, so stepping through a photo stack changes the picture
                addWallItemIntoRoom(group.spriteId, PREVIEW_DIRECTION, previewItem.stuffData.getLegacyString());
                break;
            case 'floor-item':
                updateRoomPreviewPlaneTypes(floorType, wallType, landscapeType);
                // walls off: nothing is mounted on them, so the tile fills the widget
                updateRoomPreviewPlaneVisibility(false, true);
                addFurnitureIntoRoom(group.spriteId, PREVIEW_DIRECTION, group.stuffData, group.extra);
                break;
            default:
                resetRoomPreview(false);
                break;
        }
    }, [group, previewItem, previewMode, isReady, floorType, wallType, landscapeType]);

    const showNextPreviewItem = () => {
        if (!group) return;

        setSelection(current => {
            const count = group.items.length;

            if (!count) return { groupId: group.groupId, index: -1 };

            // a fresh group starts from the top of the stack, matching a -1 index
            const index = current.groupId === group.groupId ? current.index : count - 1;

            // `set selectedItemIndex` wraps to 0 once it runs off the end
            return { groupId: group.groupId, index: (index + 1) % count };
        });
    };

    return {
        previewMode,
        previewItem,
        isPhotoItem,
        canRotate,
        rotatePreviewObject,
        changePreviewObjectState,
        showNextPreviewItem
    };
};
