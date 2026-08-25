import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

import { FurnitureListItemParser } from './Data/FurnitureListItemParser';
import type { IFurnitureListItem } from './Data/IFurnitureListItem';

export type FurniListAddOrUpdateEventMessageType = {
    items: IFurnitureListItem[];
};

export class FurniListAddOrUpdateEventMessage implements IIncomingPacket<FurniListAddOrUpdateEventMessageType> {
    public parse(wrapper: IMessageDataWrapper): FurniListAddOrUpdateEventMessageType {
        const packet: FurniListAddOrUpdateEventMessageType = {
            items: []
        };

        let count = wrapper.readInt();

        while (count > 0) {
            packet.items.push(FurnitureListItemParser(wrapper));

            count--;
        }

        return packet;
    }
}
