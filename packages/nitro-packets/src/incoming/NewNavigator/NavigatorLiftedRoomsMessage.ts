import type { IIncomingPacket, IMessageDataWrapper, INavigatorLiftedRoom } from '@nitrodevco/nitro-api';

import { NavigatorLiftedRoomParser } from './Data/NavigatorLiftedRoomParser';

export type NavigatorLiftedRoomsMessageType = {
    liftedRooms: INavigatorLiftedRoom[];
};

export class NavigatorLiftedRoomsMessage implements IIncomingPacket<NavigatorLiftedRoomsMessageType> {
    public parse(wrapper: IMessageDataWrapper): NavigatorLiftedRoomsMessageType {
        const liftedRooms: INavigatorLiftedRoom[] = [];

        let count = wrapper.readInt();

        while (count > 0) {
            liftedRooms.push(NavigatorLiftedRoomParser(wrapper));

            count--;
        }

        return { liftedRooms };
    }
}
