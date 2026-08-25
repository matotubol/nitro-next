import type { IIncomingPacket, IMessageDataWrapper, INavigatorTopLevelContext } from '@nitrodevco/nitro-api';

import { NavigatorQuickLinkListParser } from './Data/NavigatorQuickLinkParser';

export type NavigatorMetadataMessageType = {
    topLevelContexts: INavigatorTopLevelContext[];
};

export class NavigatorMetadataMessage implements IIncomingPacket<NavigatorMetadataMessageType> {
    public parse(wrapper: IMessageDataWrapper): NavigatorMetadataMessageType {
        const topLevelContexts: INavigatorTopLevelContext[] = [];

        let count = wrapper.readInt();

        while (count > 0) {
            topLevelContexts.push({
                searchCode: wrapper.readString(),
                quickLinks: NavigatorQuickLinkListParser(wrapper)
            });

            count--;
        }

        return { topLevelContexts };
    }
}
