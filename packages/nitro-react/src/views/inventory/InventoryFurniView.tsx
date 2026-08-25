import { GetInventoryTypeFilters, INVENTORY_MAIN_FILTERS, useInventoryActions, useInventorySelectors } from "#base/context";
import { useInventoryFurniFilter, useInventoryFurniFilterLabels } from "#base/hooks";
import { Border, InfiniteGrid } from "#base/theme";

import { InventoryFilterSelect } from "./InventoryFilterSelect";
import { InventoryFurniItemView } from "./InventoryFurniItemView";
import { InventoryFurniPreviewView } from "./InventoryFurniPreviewView";

// `inventory.xml`: the window is a fixed 490x342, `item_grid` is 284 wide with
// `spacing = 2`, and `preview_container` sits at x=290 with width 180. Six 42px
// tiles at that spacing come to 6*42 + 5*2 = 262, leaving 22px of the 284 for
// the scrollbar - so the grid must not add padding of its own.
const ITEM_SIZE = 42;
const ITEM_GAP = 2;
const ITEM_COLUMNS = 6;

export const InventoryFurniView = () => {
    const { selectedGroupId, mainFilter, typeFilter, searchValue } = useInventorySelectors();
    const furnitureGroups = useInventoryFurniFilter();
    const { getMainFilterLabel, getTypeFilterLabel } = useInventoryFurniFilterLabels();
    const { selectFurnitureGroup, setMainFilter, setTypeFilter, setSearchValue } = useInventoryActions();

    return (
        <div className="flex flex-col gap-1 h-full">
            <Border variant="3" tintColor="#cacaca" className="flex gap-1.5 p-1 h-6.25 items-center">
                <Border variant="0" className="w-34.75 h-5">
                    <input
                        type="text"
                        className="size-full overflow-hidden bg-transparent px-2 outline-none"
                        value={searchValue}
                        onChange={event => setSearchValue(event.target.value)}
                    />
                </Border>
                <InventoryFilterSelect
                    value={mainFilter}
                    options={INVENTORY_MAIN_FILTERS}
                    getLabel={getMainFilterLabel}
                    onChange={setMainFilter}
                    className="w-29.75 h-5.25"
                />
                <InventoryFilterSelect
                    value={typeFilter}
                    options={GetInventoryTypeFilters(mainFilter)}
                    getLabel={getTypeFilterLabel}
                    onChange={setTypeFilter}
                    className="w-29.75 h-5.25"
                />
            </Border>
            <div className="flex h-full gap-1.5 overflow-hidden">
                <InfiniteGrid
                    className="flex-1 p-0"
                    items={furnitureGroups}
                    itemWidth={ITEM_SIZE}
                    minHeight={ITEM_SIZE}
                    horizontalGap={ITEM_GAP}
                    verticalGap={ITEM_GAP}
                    overrideColumnCount={ITEM_COLUMNS}
                    getKey={group => group.groupId}
                    itemRender={group => (
                        <InventoryFurniItemView
                            group={group}
                            isSelected={group.groupId === selectedGroupId}
                            onSelect={selectFurnitureGroup}
                        />
                    )}
                />
                {/* `preview_container` is 180 wide and its children stack from the
                    top - the preview is a fixed 130 tall, not a stretched box */}
                <div className="flex flex-col w-45 shrink-0">
                    <InventoryFurniPreviewView />
                </div>
            </div>
        </div>
    );
}
