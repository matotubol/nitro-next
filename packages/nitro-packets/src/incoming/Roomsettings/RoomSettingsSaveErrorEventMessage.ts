import { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

export type RoomSettingsSaveErrorEventMessageType = {
  roomId: number;
  errorCode: number;
  info: string;
};

export class RoomSettingsSaveErrorEventMessage implements IIncomingPacket<RoomSettingsSaveErrorEventMessageType>
{
  public parse(wrapper: IMessageDataWrapper): RoomSettingsSaveErrorEventMessageType
  {

    const packet: RoomSettingsSaveErrorEventMessageType = {
      roomId: wrapper.readInt(),
      errorCode: wrapper.readInt(),
      info: wrapper.readString(),
    };

    return packet;
  }
}
