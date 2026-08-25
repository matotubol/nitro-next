import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

import { FurnitureListItemParser } from './Data/FurnitureListItemParser';
import type { IFurnitureListItem } from './Data/IFurnitureListItem';

export type FurniListEventMessageType = {
    totalFragments: number;
    currentFragment: number;
    items: IFurnitureListItem[];
};

export class FurniListEventMessage implements IIncomingPacket<FurniListEventMessageType> {
    public parse(wrapper: IMessageDataWrapper): FurniListEventMessageType {
        const packet: FurniListEventMessageType = {
            totalFragments: wrapper.readInt(),
            currentFragment: wrapper.readInt(),
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
