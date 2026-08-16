import { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type ActivityPointsMessageType = {
    pointsByCategoryId: Record<number, number>;
};

export class ActivityPointsMessage implements IIncomingPacket<ActivityPointsMessageType> {
    public parse(wrapper: IMessageDataWrapper): ActivityPointsMessageType {
        const pointsByCategoryId: Record<number, number> = {};
        const count = wrapper.readInt();

        for (let index = 0; index < count; index++)
            pointsByCategoryId[wrapper.readInt()] = wrapper.readInt();

        return { pointsByCategoryId };
    }
}
