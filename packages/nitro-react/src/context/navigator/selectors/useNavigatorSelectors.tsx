import { useShallow } from "zustand/shallow";

import { useNavigatorContext } from "../useNavigatorContext";

export const useNavigatorSelectors = () => useNavigatorContext(useShallow(x => ({
    topLevelContexts: x.topLevelContexts,
    searchCode: x.searchCode,
    filteringData: x.filteringData,
    filterType: x.filterType,
    filterText: x.filterText,
    blocks: x.blocks,
    savedSearches: x.savedSearches,
    collapsedCategoryIds: x.collapsedCategoryIds,
    liftedRooms: x.liftedRooms,
    viewModeBySearchCode: x.viewModeBySearchCode,
    resultsMode: x.resultsMode,
    isLeftPaneHidden: x.isLeftPaneHidden,
    isSearching: x.isSearching,
    hasSearched: x.hasSearched
})));
