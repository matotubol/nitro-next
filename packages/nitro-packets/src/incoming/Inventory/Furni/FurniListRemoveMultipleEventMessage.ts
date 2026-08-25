import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type FurniListRemoveMultipleEventMessageType = {
    itemIds: number[];
};

export class FurniListRemoveMultipleEventMessage implements IIncomingPacket<FurniListRemoveMultipleEventMessageType> {
    public parse(wrapper: IMessageDataWrapper): FurniListRemoveMultipleEventMessageType {
        const packet: FurniListRemoveMultipleEventMessageType = {
            itemIds: []
        };

        let count = wrapper.readInt();

        while (count > 0) {
            packet.itemIds.push(wrapper.readInt());

            count--;
        }

        return packet;
    }
}
