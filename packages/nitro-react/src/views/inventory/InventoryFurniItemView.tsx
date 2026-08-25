import type { IFurnitureGroupItem } from "#base/context";
import { useInventoryFurniIconUrl } from "#base/hooks";
import { Border, Image } from "#base/theme";

type InventoryFurniItemViewProps = {
    group: IFurnitureGroupItem;
    isSelected: boolean;
    onSelect: (groupId: number) => void;
}

// `GroupItem.updateBackgroundVisual` paints the BG_COLOR region 0xCCCCCC, or
// 0x9CCB65 while the stack still holds something the player has not seen
const BACKGROUND_COLOR = '#cccccc';
const UNSEEN_BACKGROUND_COLOR = '#9ccb65';

/**
 * `inventory_thumb.xml`: a 42x42 tile whose 40x40 BG_COLOR border is inset by 1,
 * with the count pinned top-right. `updateSelectionVisual` only toggles the
 * `outline` bitmap, so selecting an item lays a white 42x42 frame over the tile
 * rather than changing its background.
 */
export const InventoryFurniItemView = (props: InventoryFurniItemViewProps) => {
    const { group, isSelected, onSelect } = props;
    const iconUrl = useInventoryFurniIconUrl(group);

    return (
        <div
            className="relative size-10.5 cursor-pointer"
            onClick={() => onSelect(group.groupId)}>
            <Border
                variant="5"
                tintColor={group.hasUnseenItems ? UNSEEN_BACKGROUND_COLOR : BACKGROUND_COLOR}
                className="absolute inset-px flex size-10 items-center justify-center overflow-hidden">
                <Image src={iconUrl} className="max-h-full max-w-full" />
            </Border>
            {group.items.length > 1 && (
                <span className="absolute top-[3px] right-0.5 flex min-w-1.5 justify-start border-y border-l border-[#2f6982] bg-white px-0.5 pt-[3px] pb-px font-goldfish text-[9px] leading-none text-[#2f6982]">
                    {group.items.length}
                </span>
            )}
            {isSelected && (
                <div
                    className="pointer-events-none absolute inset-0 bg-contain bg-no-repeat pixel-art"
                    style={{ backgroundImage: 'url(/assets/flash/inventory/thumb_selected_outline.png)' }}
                />
            )}
        </div>
    );
}
