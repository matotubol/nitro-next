import { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type NoSuchFlatEventMessageType = {
  roomId: number;
};

export class NoSuchFlatEventMessage implements IIncomingPacket<NoSuchFlatEventMessageType>
{
  public parse(wrapper: IMessageDataWrapper): NoSuchFlatEventMessageType
  {

    const packet: NoSuchFlatEventMessageType = {
      roomId: wrapper.readInt(),
    };

    return packet;
  }
}
