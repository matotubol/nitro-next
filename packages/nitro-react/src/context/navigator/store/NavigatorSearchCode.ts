/** The top level search codes the flash client ships with, in tab order. */
export const NAVIGATOR_OFFICIAL_VIEW = 'official_view';
export const NAVIGATOR_HOTEL_VIEW = 'hotel_view';
export const NAVIGATOR_MYWORLD_VIEW = 'myworld_view';
export const NAVIGATOR_ROOM_ADS_VIEW = 'roomads_view';
export const NAVIGATOR_NEW_ADS_VIEW = 'new_ads';
export const NAVIGATOR_EVENT_CATEGORY_PREFIX = 'eventcategory__';

export const NAVIGATOR_DEFAULT_SEARCH_CODE = NAVIGATOR_OFFICIAL_VIEW;

/** `ViewMode.getViewMode` - which of the five layouts a search code renders as. */
export enum NavigatorTopViewMode {
    Official = 0,
    MyWorld = 1,
    Hotel = 2,
    RoomAd = 3,
    NewAd = 4
}

export const GetNavigatorTopViewMode = (searchCode: string): NavigatorTopViewMode => {
    switch (searchCode) {
        case NAVIGATOR_OFFICIAL_VIEW: return NavigatorTopViewMode.Official;
        case NAVIGATOR_MYWORLD_VIEW: return NavigatorTopViewMode.MyWorld;
        case NAVIGATOR_ROOM_ADS_VIEW: return NavigatorTopViewMode.RoomAd;
        case NAVIGATOR_NEW_ADS_VIEW: return NavigatorTopViewMode.NewAd;
    }

    if (searchCode.indexOf(NAVIGATOR_EVENT_CATEGORY_PREFIX) === 0) return NavigatorTopViewMode.NewAd;

    return NavigatorTopViewMode.Hotel;
}

export const IsNavigatorEventViewMode = (mode: NavigatorTopViewMode) =>
    mode === NavigatorTopViewMode.RoomAd || mode === NavigatorTopViewMode.NewAd;
