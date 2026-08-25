import { IIncomingPacket, IMessageDataWrapper, IRoomChatSettings, IRoomModerationSettings } from '@nitrodevco/nitro-api';

import { RoomChatSettingsParser } from '../Navigator/Data/RoomChatSettingsParser';
import { RoomModerationParser } from '../Navigator/Data/RoomModerationParser';

export type RoomSettingsDataEventMessageType = {
  roomId: number;
  name: string;
  description: string;
  doorMode: number;
  categoryId: number;
  maxVisitors: number;
  maxVisitorsLimit: number;
  tags: string[];
  tradeMode: number;
  allowPets: boolean;
  allowFoodConsume: boolean;
  allowWalkThrough: boolean;
  hideWalls: boolean;
  wallThickness: number;
  floorThickness: number;
  chatSettings: IRoomChatSettings;
  allowNavigatorDynCats: boolean;
  moderationSettings: IRoomModerationSettings;
};

export class RoomSettingsDataEventMessage implements IIncomingPacket<RoomSettingsDataEventMessageType>
{
  public parse(wrapper: IMessageDataWrapper): RoomSettingsDataEventMessageType
  {

    const roomId = wrapper.readInt();
    const name = wrapper.readString();
    const description = wrapper.readString();
    const doorMode = wrapper.readInt();
    const categoryId = wrapper.readInt();
    const maxVisitors = wrapper.readInt();
    const maxVisitorsLimit = wrapper.readInt();

    const tags: string[] = [];
    let tagCount = wrapper.readInt();

    while (tagCount > 0) {
      tags.push(wrapper.readString());

      tagCount--;
    }

    const packet: RoomSettingsDataEventMessageType = {
      roomId,
      name,
      description,
      doorMode,
      categoryId,
      maxVisitors,
      maxVisitorsLimit,
      tags,
      tradeMode: wrapper.readInt(),
      allowPets: wrapper.readInt() === 1,
      allowFoodConsume: wrapper.readInt() === 1,
      allowWalkThrough: wrapper.readInt() === 1,
      hideWalls: wrapper.readInt() === 1,
      wallThickness: wrapper.readInt(),
      floorThickness: wrapper.readInt(),
      chatSettings: RoomChatSettingsParser(wrapper),
      allowNavigatorDynCats: wrapper.readBoolean(),
      moderationSettings: RoomModerationParser(wrapper),
    };

    return packet;
  }
}
