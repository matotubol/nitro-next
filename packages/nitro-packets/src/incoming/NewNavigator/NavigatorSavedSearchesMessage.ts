import type { IIncomingPacket, IMessageDataWrapper, INavigatorQuickLink } from '@nitrodevco/nitro-api';

import { NavigatorQuickLinkListParser } from './Data/NavigatorQuickLinkParser';

export type NavigatorSavedSearchesMessageType = {
    savedSearches: INavigatorQuickLink[];
};

export class NavigatorSavedSearchesMessage implements IIncomingPacket<NavigatorSavedSearchesMessageType> {
    public parse(wrapper: IMessageDataWrapper): NavigatorSavedSearchesMessageType {
        return { savedSearches: NavigatorQuickLinkListParser(wrapper) };
    }
}
