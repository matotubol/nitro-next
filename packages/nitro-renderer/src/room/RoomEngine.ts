import type {
    IObjectData,
    IRoom,
    IRoomEngine,
    IRoomObjectController,
    IVector3D,
    RoomGeometryScaleType,
} from '@nitrodevco/nitro-api';
import {
    RoomObjectCategoryEnum,
    RoomObjectUserTypeName,
    RoomObjectVariableEnum, Vector3d
} from '@nitrodevco/nitro-api';
import { type ImageLike } from 'pixi.js';

import { PetFigureData } from '../session';
import { NumberBank } from '../utils';
import { GetRoomContentLoader } from './GetRoomContentLoader';
import { ObjectDataUpdateMessage } from './messages';
import { Room } from './Room';
import { RoomGeometry } from './utils';

export class RoomEngine implements IRoomEngine {
    public static TEMORARY_ROOM_ID: number = -1;

    private _rooms: Map<number, IRoom> = new Map();
    private _imageObjectIdBank = new NumberBank(1000);

    public async init(): Promise<void> {
        await GetRoomContentLoader().init();
    }

    public createRoom(roomId: number): IRoom {
        let room = this._rooms.get(roomId);

        if (room) return room;

        room = new Room(roomId);

        this._rooms.set(roomId, room);

        return room;
    }

    public getFurnitureFloorIconUrl(typeId: number): string | undefined {
        const type = GetRoomContentLoader().getFurnitureFloorNameForTypeId(typeId);
        const color = GetRoomContentLoader().getFurnitureFloorColorIndex(typeId).toString();

        return GetRoomContentLoader().getAssetIconUrl(type, color);
    }

    public getFurnitureWallIconUrl(typeId: number, extra: string | undefined): string | undefined {
        const type = GetRoomContentLoader().getFurnitureWallNameForTypeId(typeId, extra);
        const color = GetRoomContentLoader().getFurnitureWallColorIndex(typeId).toString();

        return GetRoomContentLoader().getAssetIconUrl(type, color);
    }

    public async getGenericRoomObjectImage(
        type: string,
        value: string,
        direction: IVector3D,
        scale: RoomGeometryScaleType,
        extras: number = NaN,
        objectData: IObjectData | undefined = undefined,
        state: number = -1,
        frameCount: number = -1,
        posture: string = '',
    ): Promise<ImageLike | undefined> {
        const contentLoader = GetRoomContentLoader();

        if (!type) return undefined;

        if (contentLoader.isLoaderType(type) && !contentLoader.getCollection(type)) {
            if (!(await contentLoader.downloadAssetAsync(type))) return undefined;
        }

        const room = this.getTemporaryRoom();
        const reservedObjectId = this._imageObjectIdBank.reserveNumber();

        if (reservedObjectId < 0) return undefined;

        const objectId = reservedObjectId + 1;
        const objectCategory = contentLoader.getCategoryForType(type);
        let roomObject: IRoomObjectController | undefined;
        let geometry: RoomGeometry | undefined;

        try {
            roomObject = room.createRoomObjectAndInitalize(
                objectId,
                type,
                objectCategory,
            ) as IRoomObjectController | undefined;

            if (!roomObject?.model || !roomObject.visualization) return undefined;

            const model = roomObject.model;

            switch (objectCategory) {
                case RoomObjectCategoryEnum.Floor:
                case RoomObjectCategoryEnum.Wall:
                    model.setValue(RoomObjectVariableEnum.FurnitureColor, parseInt(value));
                    model.setValue(RoomObjectVariableEnum.FurnitureExtras, extras);
                    break;
                case RoomObjectCategoryEnum.Unit:
                    if (
                        type === RoomObjectUserTypeName.User ||
                        type === RoomObjectUserTypeName.Bot ||
                        type === RoomObjectUserTypeName.RentableBot ||
                        type === RoomObjectUserTypeName.Pet
                    ) {
                        model.setValue(RoomObjectVariableEnum.Figure, value);
                    } else {
                        const figureData = new PetFigureData(value);

                        model.setValue(RoomObjectVariableEnum.PetPaletteIndex, figureData.paletteId);
                        model.setValue(RoomObjectVariableEnum.PetColor, figureData.color);

                        if (figureData.headOnly) model.setValue(RoomObjectVariableEnum.PetHeadOnly, 1);

                        if (figureData.hasCustomParts) {
                            model.setValue(RoomObjectVariableEnum.PetCustomLayerIds, figureData.customLayerIds);
                            model.setValue(RoomObjectVariableEnum.PetCustomPartsIds, figureData.customPartIds);
                            model.setValue(RoomObjectVariableEnum.PetCustomPaletteIds, figureData.customPaletteIds);
                        }

                        if (posture) model.setValue(RoomObjectVariableEnum.FigurePosture, posture);
                    }
                    break;
                case RoomObjectCategoryEnum.Room:
                    break;
            }

            roomObject.setDirection(direction);
            roomObject.setState(state, 0);

            if (state > -1 || objectData) {
                const legacyState = objectData?.getLegacyString();
                const updateState = legacyState?.length ? parseInt(legacyState) : state;

                roomObject.processUpdateMessage(new ObjectDataUpdateMessage(updateState, objectData));
            }

            geometry = new RoomGeometry(scale, new Vector3d(-135, 30, 0), new Vector3d(11, 11, 5));

            roomObject.visualization.update(geometry, 0, true, false);

            if (frameCount > 0) {
                let i = 0;

                while (i < frameCount) {
                    roomObject.visualization.update(geometry, 0, true, false);

                    i++;
                }
            }

            return await roomObject.visualization.getImage();
        } finally {
            geometry?.dispose();

            if (roomObject) room.removeRoomObject(objectId, objectCategory);

            this._imageObjectIdBank.freeNumber(reservedObjectId);
        }
    }

    public getTemporaryRoom(): IRoom {
        return this.createRoom(RoomEngine.TEMORARY_ROOM_ID);
    }
}
