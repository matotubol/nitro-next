import type { IMessageDataWrapper, NavigatorActionAllowedType, NavigatorViewModeType } from '@nitrodevco/nitro-api';

import type { IRoomInfo } from '../../Navigator/Data/RoomSettingsParser';
import { RoomSettingsParser } from '../../Navigator/Data/RoomSettingsParser';

/** One collapsible category of the results list - "My Rooms", "Popular Rooms", ... */
export interface INavigatorSearchResultBlock {
    searchCode: string;
    text: string;
    actionAllowed: NavigatorActionAllowedType;
    forceClosed: boolean;
    viewMode: NavigatorViewModeType;
    results: IRoomInfo[];
}

export const NavigatorSearchResultBlockParser = (wrapper: IMessageDataWrapper): INavigatorSearchResultBlock => {
    const block: INavigatorSearchResultBlock = {
        searchCode: wrapper.readString(),
        text: wrapper.readString(),
        actionAllowed: wrapper.readInt(),
        forceClosed: wrapper.readBoolean(),
        viewMode: wrapper.readInt(),
        results: []
    };

    let count = wrapper.readInt();

    while (count > 0) {
        block.results.push(RoomSettingsParser(wrapper));

        count--;
    }

    return block;
}
