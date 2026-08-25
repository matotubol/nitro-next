import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

import type { INavigatorSearchResultBlock } from './Data/NavigatorSearchResultBlockParser';
import { NavigatorSearchResultBlockParser } from './Data/NavigatorSearchResultBlockParser';

export type NavigatorSearchResultBlocksMessageType = {
    searchCodeOriginal: string;
    filteringData: string;
    blocks: INavigatorSearchResultBlock[];
};

export class NavigatorSearchResultBlocksMessage implements IIncomingPacket<NavigatorSearchResultBlocksMessageType> {
    public parse(wrapper: IMessageDataWrapper): NavigatorSearchResultBlocksMessageType {
        const packet: NavigatorSearchResultBlocksMessageType = {
            searchCodeOriginal: wrapper.readString(),
            filteringData: wrapper.readString(),
            blocks: []
        };

        let count = wrapper.readInt();

        while (count > 0) {
            packet.blocks.push(NavigatorSearchResultBlockParser(wrapper));

            count--;
        }

        return packet;
    }
}
