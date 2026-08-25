import { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

/** The room-flow codes the server sends through this today. */
export enum GenericErrorCode {
    InvalidPassword = -100002,
    RoomKicked = 4008,
    InvalidRoomName = 4010
}

export type GenericErrorMessageType = {
  errorCode: number;
};

export class GenericErrorMessage implements IIncomingPacket<GenericErrorMessageType>
{
  public parse(wrapper: IMessageDataWrapper): GenericErrorMessageType
  {

    const packet: GenericErrorMessageType = {
      errorCode: wrapper.readInt(),
    };

    return packet;
  }
}
