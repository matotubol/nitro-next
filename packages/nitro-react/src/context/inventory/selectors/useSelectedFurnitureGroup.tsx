import { useInventoryContext } from "../useInventoryContext";

export const useSelectedFurnitureGroup = () => useInventoryContext(x => x.furnitureGroups.find(y => y.groupId === x.selectedGroupId));
