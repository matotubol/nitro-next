import { useRef } from "react";

import { useSelectedFurnitureGroup, useTranslation } from "#base/context";
import { useInventoryFurniName, useInventoryFurniPlacement, useInventoryFurniPreview } from "#base/hooks";
import { BitmapText, Button } from "#base/theme";

/**
 * `inventory.xml` / `preview_container` (180x237). `furni_preview_widget` is a
 * `room_previewer` widget pinned to 170x130 at x=5, with `furni_preview_region`
 * over it taking the click and `nextItemButton` floating on top at x=33/y=5.
 * `preview_element_list` then stacks, carrying no spacing of its own:
 *
 *   furni_name 17 | furni_description 30 (max 45) | furni_extra 17 | spacer 12 | button 22
 *
 * 130 + 76 + 22 = 228 of the container's 237, so this is a content-height stack
 * of fixed rows - not stretched boxes, and not gapped.
 */
export const InventoryFurniPreviewView = () => {
    const group = useSelectedFurnitureGroup();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { previewItem, isPhotoItem, showNextPreviewItem } = useInventoryFurniPreview(group, canvasRef);
    const { getFurnitureName, getFurnitureDescription, getPhotoMessage, getRarityLabel } = useInventoryFurniName();
    const { canPlace, placeSelectedFurniture } = useInventoryFurniPlacement();
    const t = useTranslation();

    // a photo shows its own caption where every other item shows its furni line's
    const description = isPhotoItem ? getPhotoMessage(previewItem) : getFurnitureDescription(group);
    const rarityLabel = getRarityLabel(previewItem);

    return (
        <div className="flex flex-col overflow-hidden">
            {/* The previewer reads its size off this element, so it stays mounted at a
                fixed 170x130 even with nothing selected - `furni_preview_widget.visible`
                becomes `invisible` here rather than an unmount, which would tear the
                room down and rebuild it on the next selection. */}
            <div className={`relative ml-1.25 h-32.5 w-42.5 shrink-0 overflow-hidden${group ? '' : ' invisible'}`}>
                <canvas
                    key="inventory-room-preview"
                    ref={canvasRef}
                    className="absolute top-0 left-0 origin-top-left"
                    // `furni_preview_region` shares `placeinroom_btn`'s handler
                    onClick={() => placeSelectedFurniture()}
                />
                {isPhotoItem && (
                    <Button
                        variant="3"
                        type="button"
                        className="absolute top-1.25 left-7 h-5.75 w-32.75"
                        onClick={showNextPreviewItem}
                    >
                        <BitmapText recipe="regular-12" color="#000000" align="center" className="relative block h-4.25 w-full shrink-0">
                            {t('inventory.furni.next')}
                        </BitmapText>
                    </Button>
                )}
            </div>
            {group && (
                <>
                    <BitmapText
                        recipe="bold-12"
                        color="#000000"
                        className="relative block h-4.25 w-full shrink-0 overflow-hidden"
                    >
                        {getFurnitureName(group)}
                    </BitmapText>
                    {/* `word_wrap = true` over the 30-to-45 band, so 2-3 lines of 15 */}
                    <BitmapText
                        recipe="regular-12"
                        color="#000000"
                        wrap
                        lineHeight={15}
                        className="relative block min-h-7.5 max-h-11.25 w-full shrink overflow-hidden"
                    >
                        {description}
                    </BitmapText>
                    {/* `furni_extra`, hidden when there is nothing to say */}
                    {!!rarityLabel && (
                        <BitmapText
                            recipe="regular-12"
                            color="#000000"
                            className="relative block h-4.25 w-full shrink-0 overflow-hidden"
                        >
                            {rarityLabel}
                        </BitmapText>
                    )}
                    <div className="h-3 shrink-0" />
                    {/* `placeinroom_btn` is width=180 - the full column, not shrink-to-fit -
                        and `text_style = button_shiny_regular` at height 22, which is
                        variant 3 (min-h-5.5, black shiny text), not the plain 102 */}
                    <Button
                        variant="3"
                        className="h-5.5 w-full shrink-0"
                        disabled={!canPlace}
                        onClick={() => placeSelectedFurniture()}
                    >
                        <BitmapText recipe="regular-12" color="#000000" align="center" className="relative block h-4.25 w-full shrink-0">
                            {t('inventory.furni.placetoroom')}
                        </BitmapText>
                    </Button>
                </>
            )}
        </div>
    );
}
