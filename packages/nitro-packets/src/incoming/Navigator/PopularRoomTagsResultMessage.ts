import type { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export interface IPopularRoomTag {
    tag: string;
    userCount: number;
}

export type PopularRoomTagsResultMessageType = {
    tags: IPopularRoomTag[];
};

export class PopularRoomTagsResultMessage implements IIncomingPacket<PopularRoomTagsResultMessageType> {
    public parse(wrapper: IMessageDataWrapper): PopularRoomTagsResultMessageType {
        const tags: IPopularRoomTag[] = [];

        if (!wrapper.bytesAvailable) return { tags };

        let count = wrapper.readInt();

        while (count > 0) {
            tags.push({
                tag: wrapper.readString(),
                userCount: wrapper.readInt()
            });

            count--;
        }

        return { tags };
    }
}
