import type { INavigatorLiftedRoom, INavigatorQuickLink, INavigatorTopLevelContext } from '@nitrodevco/nitro-api';
import { NavigatorSearchFilterType, NavigatorViewModeType } from '@nitrodevco/nitro-api';
import type { INavigatorEventCategory, INavigatorFlatCategory, INavigatorSearchResultBlock, IRoomInfo, RoomSettingsDataEventMessageType } from '@nitrodevco/nitro-packets';
import { createStore } from 'zustand';

import { NavigatorDoorState } from './NavigatorDoorState';
import { NAVIGATOR_DEFAULT_SEARCH_CODE } from './NavigatorSearchCode';

/** The room a doorbell or password prompt is currently negotiating entry to. */
export type NavigatorDoorData = {
    roomInfo: IRoomInfo | undefined;
    state: NavigatorDoorState;
}

/** A failed room-settings save, kept until the next attempt or close. */
export type NavigatorRoomSettingsError = {
    code: number;
    info: string;
}

const FILTER_PREFIXES: [NavigatorSearchFilterType, string][] = [
    [NavigatorSearchFilterType.RoomName, 'roomname:'],
    [NavigatorSearchFilterType.Owner, 'owner:'],
    [NavigatorSearchFilterType.Tag, 'tag:'],
    [NavigatorSearchFilterType.Group, 'group:']
];

/** owner:frank -> [Owner, frank]; anything unprefixed searches everything. */
export const splitFilter = (filteringData: string): [NavigatorSearchFilterType, string] => {
    for (const [type, prefix] of FILTER_PREFIXES) {
        if (filteringData.indexOf(prefix) === 0) return [type, filteringData.substring(prefix.length)];
    }

    return [NavigatorSearchFilterType.Anything, filteringData];
}

export const joinFilter = (filterType: NavigatorSearchFilterType, filterText: string) => {
    if (!filterText.length) return '';

    for (const [type, prefix] of FILTER_PREFIXES) {
        if (type === filterType) return prefix + filterText;
    }

    return filterText;
}

type State = {
    /** Tabs across the top, from NavigatorMetaDataMessage. */
    topLevelContexts: INavigatorTopLevelContext[];
    /** Search code the results on screen belong to - drives the selected tab. */
    searchCode: string;
    filteringData: string;
    filterType: NavigatorSearchFilterType;
    filterText: string;
    blocks: INavigatorSearchResultBlock[];
    savedSearches: INavigatorQuickLink[];
    collapsedCategoryIds: string[];
    liftedRooms: INavigatorLiftedRoom[];
    /** Per block overrides on top of resultsMode. */
    viewModeBySearchCode: Record<string, NavigatorViewModeType>;
    resultsMode: NavigatorViewModeType;
    isLeftPaneHidden: boolean;
    isSearching: boolean;
    hasSearched: boolean;
    /** Room whose info bubble is open, if any. */
    infoRoom: IRoomInfo | undefined;
    /** Where `RoomInfoPopup.showAt` was told to hang the bubble, in screen space. */
    infoRoomAnchor: { x: number; y: number } | undefined;
    favouriteRoomIds: number[];
    favouriteLimit: number;
    homeRoomId: number;
    flatCategories: INavigatorFlatCategory[];
    eventCategories: INavigatorEventCategory[];
    canCreateRoom: boolean;
    createdRoomLimit: number;
    isCreatorOpen: boolean;
    /** Set from GetGuestRoomResultMessage while entering - the room we are in. */
    enteredRoom: IRoomInfo | undefined;
    currentRoomId: number;
    currentRoomIsOwner: boolean;
    currentRoomRating: number;
    canRateCurrentRoom: boolean;
    isCurrentRoomStaffPick: boolean;
    doorData: NavigatorDoorData;
    /** Names ringing the bell of a room we hold rights in, oldest first. */
    doorbellKnocks: string[];
    /** The settings form the server handed us; the modal is open while this is set. */
    roomSettingsData: RoomSettingsDataEventMessageType | undefined;
    roomSettingsError: NavigatorRoomSettingsError | undefined;
}

type Actions = {
    setTopLevelContexts: (topLevelContexts: INavigatorTopLevelContext[]) => void;
    setSearchResult: (searchCode: string, filteringData: string, blocks: INavigatorSearchResultBlock[]) => void;
    setFilter: (filterType: NavigatorSearchFilterType, filterText: string) => void;
    setSavedSearches: (savedSearches: INavigatorQuickLink[]) => void;
    setCollapsedCategoryIds: (collapsedCategoryIds: string[]) => void;
    toggleCollapsedCategory: (searchCode: string) => boolean;
    setLiftedRooms: (liftedRooms: INavigatorLiftedRoom[]) => void;
    setViewMode: (searchCode: string, viewMode: NavigatorViewModeType) => void;
    setPreferences: (isLeftPaneHidden: boolean, resultsMode: NavigatorViewModeType) => void;
    setIsLeftPaneHidden: (isLeftPaneHidden: boolean) => void;
    setIsSearching: (isSearching: boolean) => void;
    setInfoRoom: (infoRoom: IRoomInfo | undefined, infoRoomAnchor?: { x: number; y: number }) => void;
    toggleInfoRoom: (infoRoom: IRoomInfo, infoRoomAnchor: { x: number; y: number }) => void;
    setFavourites: (favouriteLimit: number, favouriteRoomIds: number[]) => void;
    setFavourite: (roomId: number, added: boolean) => void;
    setHomeRoomId: (homeRoomId: number) => void;
    setFlatCategories: (flatCategories: INavigatorFlatCategory[]) => void;
    setEventCategories: (eventCategories: INavigatorEventCategory[]) => void;
    setCanCreateRoom: (canCreateRoom: boolean, createdRoomLimit: number) => void;
    setIsCreatorOpen: (isCreatorOpen: boolean) => void;
    setEnteredRoom: (enteredRoom: IRoomInfo | undefined, isCurrentRoomStaffPick: boolean) => void;
    setCurrentRoom: (currentRoomId: number, currentRoomIsOwner: boolean) => void;
    setCurrentRoomRating: (currentRoomRating: number, canRateCurrentRoom: boolean) => void;
    setDoorData: (doorData: NavigatorDoorData) => void;
    setDoorState: (state: NavigatorDoorState) => void;
    addDoorbellKnock: (name: string) => void;
    removeDoorbellKnock: (name: string) => void;
    clearDoorbellKnocks: () => void;
    setRoomSettingsData: (roomSettingsData: RoomSettingsDataEventMessageType | undefined) => void;
    setRoomSettingsError: (roomSettingsError: NavigatorRoomSettingsError | undefined) => void;
    resetNavigator: () => void;
}

const initialState: State = {
    topLevelContexts: [],
    searchCode: NAVIGATOR_DEFAULT_SEARCH_CODE,
    filteringData: '',
    filterType: NavigatorSearchFilterType.Anything,
    filterText: '',
    blocks: [],
    savedSearches: [],
    collapsedCategoryIds: [],
    liftedRooms: [],
    viewModeBySearchCode: {},
    resultsMode: NavigatorViewModeType.Rows,
    isLeftPaneHidden: false,
    isSearching: false,
    hasSearched: false,
    infoRoom: undefined,
    infoRoomAnchor: undefined,
    favouriteRoomIds: [],
    favouriteLimit: 0,
    homeRoomId: -1,
    flatCategories: [],
    eventCategories: [],
    canCreateRoom: true,
    createdRoomLimit: 0,
    isCreatorOpen: false,
    enteredRoom: undefined,
    currentRoomId: -1,
    currentRoomIsOwner: false,
    currentRoomRating: 0,
    canRateCurrentRoom: false,
    isCurrentRoomStaffPick: false,
    doorData: { roomInfo: undefined, state: NavigatorDoorState.None },
    doorbellKnocks: [],
    roomSettingsData: undefined,
    roomSettingsError: undefined
};

export type NavigatorContextStore = State & Actions;

export const createNavigatorContextStore = () => createStore<NavigatorContextStore>()((set, get) => ({
    ...initialState,
    setTopLevelContexts: topLevelContexts => set({ topLevelContexts }),
    setSearchResult: (searchCode, filteringData, blocks) => set(state => {
        // the server echoes the filter back, so the input and the dropdown follow
        // whatever actually ran - including a quick link that carried its own filter
        const [filterType, filterText] = splitFilter(filteringData);

        // forceClosed blocks arrive folded; everything else keeps the local choice
        const collapsedCategoryIds = [...state.collapsedCategoryIds];

        for (const block of blocks) {
            if (!block.forceClosed || collapsedCategoryIds.indexOf(block.searchCode) >= 0) continue;

            collapsedCategoryIds.push(block.searchCode);
        }

        return {
            searchCode,
            filteringData,
            filterType,
            filterText,
            blocks,
            collapsedCategoryIds,
            isSearching: false,
            hasSearched: true
        };
    }),
    setFilter: (filterType, filterText) => set({ filterType, filterText }),
    setSavedSearches: savedSearches => set({ savedSearches }),
    setCollapsedCategoryIds: collapsedCategoryIds => set({ collapsedCategoryIds }),
    toggleCollapsedCategory: searchCode => {
        const collapsedCategoryIds = [...get().collapsedCategoryIds];
        const index = collapsedCategoryIds.indexOf(searchCode);
        const isCollapsing = index === -1;

        if (isCollapsing) collapsedCategoryIds.push(searchCode);
        else collapsedCategoryIds.splice(index, 1);

        set({ collapsedCategoryIds });

        return isCollapsing;
    },
    setLiftedRooms: liftedRooms => set({ liftedRooms }),
    setViewMode: (searchCode, viewMode) => set(state => ({
        viewModeBySearchCode: { ...state.viewModeBySearchCode, [searchCode]: viewMode }
    })),
    setPreferences: (isLeftPaneHidden, resultsMode) => set({ isLeftPaneHidden, resultsMode }),
    setIsLeftPaneHidden: isLeftPaneHidden => set({ isLeftPaneHidden }),
    setIsSearching: isSearching => set({ isSearching }),
    setInfoRoom: (infoRoom, infoRoomAnchor) => set({ infoRoom, infoRoomAnchor }),
    /** `showRoomInfoBubbleAt` closes an open bubble instead of moving it. */
    toggleInfoRoom: (infoRoom, infoRoomAnchor) => set(state => state.infoRoom
        ? { infoRoom: undefined, infoRoomAnchor: undefined }
        : { infoRoom, infoRoomAnchor }),
    setFavourites: (favouriteLimit, favouriteRoomIds) => set({ favouriteLimit, favouriteRoomIds }),
    setFavourite: (roomId, added) => set(state => {
        const favouriteRoomIds = [...state.favouriteRoomIds];
        const index = favouriteRoomIds.indexOf(roomId);

        if (added && index === -1) favouriteRoomIds.push(roomId);
        else if (!added && index >= 0) favouriteRoomIds.splice(index, 1);

        return { favouriteRoomIds };
    }),
    setHomeRoomId: homeRoomId => set({ homeRoomId }),
    setFlatCategories: flatCategories => set({ flatCategories }),
    setEventCategories: eventCategories => set({ eventCategories }),
    setCanCreateRoom: (canCreateRoom, createdRoomLimit) => set({ canCreateRoom, createdRoomLimit }),
    setIsCreatorOpen: isCreatorOpen => set({ isCreatorOpen }),
    setEnteredRoom: (enteredRoom, isCurrentRoomStaffPick) => set({ enteredRoom, isCurrentRoomStaffPick }),
    setCurrentRoom: (currentRoomId, currentRoomIsOwner) => set({ currentRoomId, currentRoomIsOwner }),
    setCurrentRoomRating: (currentRoomRating, canRateCurrentRoom) => set({ currentRoomRating, canRateCurrentRoom }),
    setDoorData: doorData => set({ doorData }),
    setDoorState: doorState => set(prev => ({ doorData: { ...prev.doorData, state: doorState } })),
    addDoorbellKnock: name => set(state => state.doorbellKnocks.indexOf(name) >= 0
        ? state
        : { doorbellKnocks: [...state.doorbellKnocks, name] }),
    removeDoorbellKnock: name => set(state => {
        const index = state.doorbellKnocks.indexOf(name);

        if (index === -1) return state;

        const doorbellKnocks = [...state.doorbellKnocks];

        doorbellKnocks.splice(index, 1);

        return { doorbellKnocks };
    }),
    clearDoorbellKnocks: () => set({ doorbellKnocks: [] }),
    /** Opening a fresh form always drops the previous attempt's error with it. */
    setRoomSettingsData: roomSettingsData => set({ roomSettingsData, roomSettingsError: undefined }),
    setRoomSettingsError: roomSettingsError => set({ roomSettingsError }),
    resetNavigator: () => set({ ...initialState })
}));
