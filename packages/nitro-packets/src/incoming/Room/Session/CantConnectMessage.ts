import { IIncomingPacket, IMessageDataWrapper } from '@nitrodevco/nitro-api';

/** Matches RoomConnectionErrorType on the server. */
export enum CantConnectReason {
    RoomFull = 1,
    NoEntry = 2,
    EnterQueue = 3,
    Banned = 4
}

export type CantConnectMessageType = {
  errorType: CantConnectReason;
  additionalInfo: string;
};

export class CantConnectMessage implements IIncomingPacket<CantConnectMessageType>
{
  public parse(wrapper: IMessageDataWrapper): CantConnectMessageType
  {

    const packet: CantConnectMessageType = {
      errorType: wrapper.readInt(),
      additionalInfo: wrapper.readString(),
    };

    return packet;
  }
}
