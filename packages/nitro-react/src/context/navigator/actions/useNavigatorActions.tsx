import { useShallow } from "zustand/shallow";

import { useNavigatorContext } from "../useNavigatorContext";

export const useNavigatorActions = () => useNavigatorContext(useShallow(x => ({
    setTopLevelContexts: x.setTopLevelContexts,
    setSearchResult: x.setSearchResult,
    setFilter: x.setFilter,
    setSavedSearches: x.setSavedSearches,
    setCollapsedCategoryIds: x.setCollapsedCategoryIds,
    toggleCollapsedCategory: x.toggleCollapsedCategory,
    setLiftedRooms: x.setLiftedRooms,
    setViewMode: x.setViewMode,
    setPreferences: x.setPreferences,
    setIsLeftPaneHidden: x.setIsLeftPaneHidden,
    setIsSearching: x.setIsSearching,
    setInfoRoom: x.setInfoRoom,
    toggleInfoRoom: x.toggleInfoRoom,
    setFavourites: x.setFavourites,
    setFavourite: x.setFavourite,
    setHomeRoomId: x.setHomeRoomId,
    setFlatCategories: x.setFlatCategories,
    setEventCategories: x.setEventCategories,
    setCanCreateRoom: x.setCanCreateRoom,
    setIsCreatorOpen: x.setIsCreatorOpen,
    setEnteredRoom: x.setEnteredRoom,
    setCurrentRoom: x.setCurrentRoom,
    setCurrentRoomRating: x.setCurrentRoomRating,
    setDoorData: x.setDoorData,
    setDoorState: x.setDoorState,
    addDoorbellKnock: x.addDoorbellKnock,
    removeDoorbellKnock: x.removeDoorbellKnock,
    clearDoorbellKnocks: x.clearDoorbellKnocks,
    setRoomSettingsData: x.setRoomSettingsData,
    setRoomSettingsError: x.setRoomSettingsError,
    resetNavigator: x.resetNavigator
})));
