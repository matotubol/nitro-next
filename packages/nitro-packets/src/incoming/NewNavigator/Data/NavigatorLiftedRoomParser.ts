import type { IMessageDataWrapper, INavigatorLiftedRoom } from '@nitrodevco/nitro-api';

export const NavigatorLiftedRoomParser = (wrapper: IMessageDataWrapper): INavigatorLiftedRoom => ({
    flatId: wrapper.readInt(),
    areaId: wrapper.readInt(),
    image: wrapper.readString(),
    caption: wrapper.readString()
});
