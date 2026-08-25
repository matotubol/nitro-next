import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type FurniListRemoveEventMessageType = {
    itemId: number;
};

export class FurniListRemoveEventMessage implements IIncomingPacket<FurniListRemoveEventMessageType> {
    public parse(wrapper: IMessageDataWrapper): FurniListRemoveEventMessageType {
        const packet: FurniListRemoveEventMessageType = {
            itemId: wrapper.readInt()
        };

        return packet;
    }
}
