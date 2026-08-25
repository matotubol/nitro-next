import { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type RoomSettingsSavedEventMessageType = {
  roomId: number;
};

export class RoomSettingsSavedEventMessage implements IIncomingPacket<RoomSettingsSavedEventMessageType>
{
  public parse(wrapper: IMessageDataWrapper): RoomSettingsSavedEventMessageType
  {

    const packet: RoomSettingsSavedEventMessageType = {
      roomId: wrapper.readInt(),
    };

    return packet;
  }
}
