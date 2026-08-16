import { AvatarActionStateType, AvatarExpressionEnum, FurnitureUsagePolicyEnum, IObjectData, IRoom, IRoomObjectController, IVector3D, LegacyDataType, RoomEngineObjectEvent, RoomGeometryScaleType, RoomId, RoomObjectCategoryEnum, RoomObjectUserType, RoomObjectUserTypeName, RoomObjectVariableEnum, Vector3d } from "@nitrodevco/nitro-api";
import { GetRoomEngine, GetTicker, TextureUtils } from "@nitrodevco/nitro-renderer";
import { PointData, Rectangle, Ticker } from "pixi.js";
import { RefObject, useEffect, useRef, useState } from "react";

import { useRoomMapping } from "./useRoomMapping";

const PREVIEW_OBJECT_ID: number = 1;
const PREVIEW_OBJECT_LOCATION = new Vector3d(2, 2, 0);
const PREVIEW_AVATAR_SIT_LOCATION = new Vector3d(2, 2, 0.55);
const PREVIEW_AVATAR_LAY_LOCATION = new Vector3d(1, 1, 0.8);
const PREVIEW_AVATAR_ACTION_COUNT: number = 6;
const PREVIEW_AVATAR_ACTION_STAND: number = 0;
const PREVIEW_AVATAR_ACTION_WALK: number = 1;
const PREVIEW_AVATAR_ACTION_DANCE: number = 2;
const PREVIEW_AVATAR_ACTION_SIT: number = 3;
const PREVIEW_AVATAR_ACTION_LAY: number = 4;
const PREVIEW_AVATAR_ACTION_WAVE: number = 5;
const PREVIEW_WALL_ITEM_LOCATION = new Vector3d(0.5, 2.3, 1.8);
const PREVIEW_WALL_ITEM_DEFAULT_DIRECTION: number = 90;
const PREVIEW_WALL_ITEM_MIRRORED_DIRECTION: number = 180;
const ALLOWED_IMAGE_CUT: number = 0.25;
const PREVIEW_CAMERA_DISTANCE: number = 30;
const AUTOMATIC_STATE_CHANGE_INTERVAL: number = 2500;
const DEFAULT_PREVIEW_FLOOR_TYPE = '110';
const DEFAULT_PREVIEW_WALL_TYPE = '99999';
const DEFAULT_PREVIEW_LANDSCAPE_TYPE = '1';

type RoomPreviewerOptions = {
    centerWallItems?: boolean;
};

export const useRoomPreviewer = (
    roomId: number,
    canvasRef: RefObject<HTMLCanvasElement | null>,
    { centerWallItems = false }: RoomPreviewerOptions = {},
) => {
    const roomRef = useRef<IRoom | undefined>(undefined);
    const [isReady, setIsReady] = useState<boolean>(false);
    const [canRotate, setCanRotate] = useState<boolean>(false);
    const { createMapForSize } = useRoomMapping();
    const currentObjectCategory = useRef<RoomObjectCategoryEnum>(RoomObjectCategoryEnum.Minimum);
    const currentPreviewClassId = useRef<number>(-1);
    const currentPreviewExtraParam = useRef<string>('');
    const currentPreviewRectangle = useRef<Rectangle | null>(null);
    const currentPreviewWidth = useRef<number>(0);
    const currentPreviewHeight = useRef<number>(0);
    const currentPreviewScale = useRef<number>(1);
    const addViewOffset = useRef<PointData>({ x: 0, y: 0 });
    const needsZoomOut = useRef<boolean>(false);
    const canRotateRef = useRef<boolean>(false);
    const automaticStateChange = useRef<boolean>(false);
    const previousAutomaticStateChangeTime = useRef<number>(-1);
    const currentAvatarAction = useRef<number>(PREVIEW_AVATAR_ACTION_STAND);

    const getValidRoomObjectDirection = (roomObject: IRoomObjectController, forward: boolean) => {
        if (!roomObject?.model) return 0;

        const allowedDirections: number[] = roomObject.type === RoomObjectUserTypeName.MonsterPlant
            ? roomObject.model.getValue<number[]>(RoomObjectVariableEnum.PetAllowedDirections)
            : roomObject.model.getValue<number[]>(RoomObjectVariableEnum.FurnitureAllowedDirections);

        const direction = roomObject.getDirection().x;

        if (!allowedDirections?.length) return direction;

        let dirIndex = allowedDirections.indexOf(direction);

        if (dirIndex < 0) {
            const insertAt = allowedDirections.findIndex(d => direction <= d);
            dirIndex = insertAt < 0 ? 0 : insertAt;
        }

        dirIndex = forward
            ? (dirIndex + 1) % allowedDirections.length
            : (dirIndex - 1 + allowedDirections.length) % allowedDirections.length;

        return allowedDirections[dirIndex];
    };

    const setCanRotatePreview = (value: boolean) => {
        if (canRotateRef.current === value) return;

        canRotateRef.current = value;
        setCanRotate(value);
    };

    const changePreviewObjectState = (automatic: boolean = false) => {
        const room = roomRef.current;

        if (!room || currentObjectCategory.current === RoomObjectCategoryEnum.Unit) return false;

        if (!automatic) automaticStateChange.current = false;

        return room.updateRoomObjectState(PREVIEW_OBJECT_ID, currentObjectCategory.current);
    };

    const applyInvisibleLayerState = (roomObject: IRoomObjectController | undefined) => {
        roomObject?.model.setValue(RoomObjectVariableEnum.FurnitureInvisibleLayer, 1);
    };

    const startAutomaticStateChange = () => {
        automaticStateChange.current = true;
        previousAutomaticStateChangeTime.current = GetTicker().lastTime;
    };

    const updateAutomaticStateChange = (time: number) => {
        if (!automaticStateChange.current || time <= previousAutomaticStateChangeTime.current + AUTOMATIC_STATE_CHANGE_INTERVAL) return;

        previousAutomaticStateChangeTime.current = time;
        changePreviewObjectState(true);
    };

    const canRotatePreviewObject = () => {
        const room = roomRef.current;

        if (!room) return false;

        const roomObject = room.getRoomObject(PREVIEW_OBJECT_ID, currentObjectCategory.current);

        if (!roomObject) return false;

        if (currentObjectCategory.current === RoomObjectCategoryEnum.Unit) return true;

        if (currentObjectCategory.current === RoomObjectCategoryEnum.Wall) return true;

        if (currentObjectCategory.current !== RoomObjectCategoryEnum.Floor) return false;

        const allowedDirections = roomObject.model.getValue<number[]>(RoomObjectVariableEnum.FurnitureAllowedDirections);

        return !!allowedDirections && allowedDirections.length > 1;
    };

    const isPreviewWallItemMirrored = (direction: number) => {
        direction = ((direction % 360) + 360) % 360;

        return direction === PREVIEW_WALL_ITEM_MIRRORED_DIRECTION;
    };

    const getPreviewWallItemZ = (roomObject: IRoomObjectController) => {
        const sizeZ = roomObject.model.getValue<number>(RoomObjectVariableEnum.FurnitureSizeZ);
        const centerZ = roomObject.model.getValue<number>(RoomObjectVariableEnum.FurnitureCenterZ);

        if (Number.isFinite(sizeZ) && Number.isFinite(centerZ)) return ((3.6 - sizeZ) / 2) + centerZ;

        const location = roomObject.getLocation();

        if (!Number.isNaN(location.z)) return location.z;

        return PREVIEW_WALL_ITEM_LOCATION.z;
    };

    const updatePreviewWallItemLocation = (roomObject: IRoomObjectController) => {
        const room = roomRef.current;

        if (!room) return;

        const mirrored = isPreviewWallItemMirrored(roomObject.getDirection().x);
        const x = mirrored ? PREVIEW_WALL_ITEM_LOCATION.y : PREVIEW_WALL_ITEM_LOCATION.x;
        const y = mirrored ? PREVIEW_WALL_ITEM_LOCATION.x : PREVIEW_WALL_ITEM_LOCATION.y;
        const z = getPreviewWallItemZ(roomObject);
        const currentLocation = roomObject.getLocation();

        if (currentLocation.x === x && currentLocation.y === y && currentLocation.z === z) return;

        room.updateRoomObjectWallLocation(PREVIEW_OBJECT_ID, new Vector3d(x, y, z));
    };

    const normalizeAvatarDirection = (direction: number) => {
        direction = Math.round(direction / 45) % 8;

        return direction < 0 ? direction + 8 : direction;
    };

    const isDiagonalAvatarDirection = (direction: number) => (normalizeAvatarDirection(direction) % 2) !== 0;

    const isValidLayingDirection = (direction: number) => {
        const normalized = normalizeAvatarDirection(direction);

        return normalized === 0 || normalized === 2;
    };

    const applyPreviewAvatarAction = (action: number) => {
        const room = roomRef.current;

        if (!room || currentObjectCategory.current !== RoomObjectCategoryEnum.Unit) return false;

        const roomObject = room.getRoomObject(PREVIEW_OBJECT_ID, RoomObjectCategoryEnum.Unit);

        if (!roomObject) return false;

        room.updateRoomObjectUserAction(PREVIEW_OBJECT_ID, RoomObjectVariableEnum.FigureDance, 0);
        room.updateRoomObjectUserAction(PREVIEW_OBJECT_ID, RoomObjectVariableEnum.FigureExpression, 0);

        let location = PREVIEW_OBJECT_LOCATION;

        switch (action) {
            case PREVIEW_AVATAR_ACTION_WALK:
                room.updateRoomObjectUserPosture(PREVIEW_OBJECT_ID, AvatarActionStateType.Walk);
                break;
            case PREVIEW_AVATAR_ACTION_DANCE:
                room.updateRoomObjectUserPosture(PREVIEW_OBJECT_ID, AvatarActionStateType.Stand);
                room.updateRoomObjectUserAction(PREVIEW_OBJECT_ID, RoomObjectVariableEnum.FigureDance, 1);
                break;
            case PREVIEW_AVATAR_ACTION_SIT:
                location = PREVIEW_AVATAR_SIT_LOCATION;
                room.updateRoomObjectUserPosture(PREVIEW_OBJECT_ID, AvatarActionStateType.Sit);
                break;
            case PREVIEW_AVATAR_ACTION_LAY:
                location = PREVIEW_AVATAR_LAY_LOCATION;
                room.updateRoomObjectUserPosture(PREVIEW_OBJECT_ID, AvatarActionStateType.Lay);
                break;
            case PREVIEW_AVATAR_ACTION_WAVE:
                room.updateRoomObjectUserPosture(PREVIEW_OBJECT_ID, AvatarActionStateType.Stand);
                room.updateRoomObjectUserAction(PREVIEW_OBJECT_ID, RoomObjectVariableEnum.FigureExpression, AvatarExpressionEnum.Wave);
                break;
            default:
                room.updateRoomObjectUserPosture(PREVIEW_OBJECT_ID, AvatarActionStateType.Stand);
                break;
        }

        const direction = roomObject.getDirection();
        const headDirection = roomObject.model.getValue<number>(RoomObjectVariableEnum.HeadDirection);

        room.updateRoomObjectUser(PREVIEW_OBJECT_ID, location, location, false, 0, direction, headDirection);
        currentAvatarAction.current = action;
        updateRoomPreview();
        room.update(-1, true);

        return true;
    };

    const cyclePreviewAvatarAction = () => {
        const room = roomRef.current;

        if (!room || currentObjectCategory.current !== RoomObjectCategoryEnum.Unit) return false;

        const roomObject = room.getRoomObject(PREVIEW_OBJECT_ID, RoomObjectCategoryEnum.Unit);

        if (!roomObject) return false;

        const direction = roomObject.getDirection().x;
        let action = currentAvatarAction.current;

        do {
            action = (action + 1) % PREVIEW_AVATAR_ACTION_COUNT;
        }
        while (
            (action === PREVIEW_AVATAR_ACTION_SIT && isDiagonalAvatarDirection(direction)) ||
            (action === PREVIEW_AVATAR_ACTION_LAY && !isValidLayingDirection(direction))
        );

        return applyPreviewAvatarAction(action);
    };

    const rotatePreviewObject = (forward: boolean) => {
        const room = roomRef.current;

        if (!room) return false;

        const roomObject = room.getRoomObject(PREVIEW_OBJECT_ID, currentObjectCategory.current);

        if (!roomObject) return false;

        let direction = roomObject.getDirection().x;

        switch (currentObjectCategory.current) {
            case RoomObjectCategoryEnum.Unit: {
                let directionStep = forward ? -1 : 1;
                const directionIndex = normalizeAvatarDirection(direction);

                if (currentAvatarAction.current === PREVIEW_AVATAR_ACTION_SIT && isDiagonalAvatarDirection(direction + (directionStep * 45))) {
                    directionStep *= 2;
                }
                else if (currentAvatarAction.current === PREVIEW_AVATAR_ACTION_LAY && !isValidLayingDirection(direction + (directionStep * 45))) {
                    directionStep = directionIndex === 0 ? 2 : -directionIndex;
                }

                direction = normalizeAvatarDirection(direction + (directionStep * 45)) * 45;

                room.updateRoomObjectUserDirection(
                    PREVIEW_OBJECT_ID,
                    new Vector3d(direction),
                    direction,
                );
                break;
            }
            case RoomObjectCategoryEnum.Floor: {
                direction = getValidRoomObjectDirection(roomObject, forward);

                if (direction === roomObject.getDirection().x) return false;

                roomObject.setDirection(new Vector3d(direction));
                break;
            }
            case RoomObjectCategoryEnum.Wall: {
                direction = isPreviewWallItemMirrored(direction)
                    ? PREVIEW_WALL_ITEM_DEFAULT_DIRECTION
                    : PREVIEW_WALL_ITEM_MIRRORED_DIRECTION;

                roomObject.setDirection(new Vector3d(direction));
                updatePreviewWallItemLocation(roomObject);
                currentPreviewRectangle.current = null;
                break;
            }
            default:
                return false;
        }

        updateRoomPreview();
        room.update(-1, true);

        return true;
    };

    const getCanvasOffset = (point: PointData) => {
        const rectangle = currentPreviewRectangle.current;
        const isCenteredWallItem = centerWallItems && currentObjectCategory.current === RoomObjectCategoryEnum.Wall;

        if (!rectangle || rectangle.width < 1 || rectangle.height < 1) {
            if (isCenteredWallItem && addViewOffset.current.x !== point.x) {
                return { x: addViewOffset.current.x, y: point.y };
            }

            return isCenteredWallItem ? undefined : point;
        }

        let x = isCenteredWallItem
            ? Math.trunc(addViewOffset.current.x)
            : (-(rectangle.left + rectangle.right) >> 1);
        let y = (-(rectangle.top + rectangle.bottom) >> 1);
        const height = ((currentPreviewHeight.current - rectangle.height) >> 1);

        if (height > 10) {
            y = Math.trunc(y + Math.min(15, (height - 10)));
        }
        else
            if (currentObjectCategory.current !== RoomObjectCategoryEnum.Unit) {
                y = Math.trunc(y + (5 - Math.max(0, (height / 2))));
            }
            else {
                y = Math.trunc(y - (5 - Math.min(0, (height / 2))));
            }

        y = Math.trunc(y + addViewOffset.current.y);

        if (!isCenteredWallItem) x = Math.trunc(x + addViewOffset.current.x);

        const offsetX = (x - point.x);
        const offsetY = (y - point.y);

        if (offsetX !== 0 || offsetY !== 0) {
            const sqrt = Math.sqrt(((offsetX * offsetX) + (offsetY * offsetY)));

            if (sqrt > 10) {
                x = Math.trunc(point.x + ((offsetX * 10) / sqrt));
                y = Math.trunc(point.y + ((offsetY * 10) / sqrt));
            }

            return { x, y };
        }

        return undefined;
    };

    const setAddViewOffset = (point: PointData) => {
        addViewOffset.current = { x: point.x, y: point.y };
    };

    const updateRoomPreviewPlaneTypes = (
        floorType?: string,
        wallType?: string,
        landscapeType?: string,
    ) => roomRef.current?.updateRoomPlaneType(floorType, wallType, landscapeType) ?? false;

    const resetRoomPreviewPlaneTypes = () =>
        updateRoomPreviewPlaneTypes(
            DEFAULT_PREVIEW_FLOOR_TYPE,
            DEFAULT_PREVIEW_WALL_TYPE,
            DEFAULT_PREVIEW_LANDSCAPE_TYPE,
        );

    const validatePreviewSize = (point: PointData) => {
        const room = roomRef.current;

        if (!room || !room.canvas || !currentPreviewRectangle.current || (currentPreviewRectangle.current.width < 1) || (currentPreviewRectangle.current.height < 1)) return point;

        if ((currentPreviewRectangle.current.width > (currentPreviewWidth.current * (1 + ALLOWED_IMAGE_CUT))) || (currentPreviewRectangle.current.height > (currentPreviewHeight.current * (1 + ALLOWED_IMAGE_CUT)))) {
            if (room.canvas.scale !== 0.5) {
                room.canvas.setScale(0.5);

                currentPreviewScale.current = 0.5;
                needsZoomOut.current = true;

                point.x = (point.x >> 1);
                point.y = (point.y >> 1);

                currentPreviewRectangle.current.x = currentPreviewRectangle.current.x >> 2;
                currentPreviewRectangle.current.y = currentPreviewRectangle.current.y >> 2;
                currentPreviewRectangle.current.width = currentPreviewRectangle.current.width >> 2;
                currentPreviewRectangle.current.height = currentPreviewRectangle.current.height >> 2;
            }
        } else if ((((currentPreviewRectangle.current.width << 1) < ((currentPreviewWidth.current * (1 + ALLOWED_IMAGE_CUT)) - 5)) && ((currentPreviewRectangle.current.height << 1) < ((currentPreviewHeight.current * (1 + ALLOWED_IMAGE_CUT)) - 5)))) {
            if (room.canvas.scale !== 1 && !needsZoomOut.current) {
                room.canvas.setScale(1);

                currentPreviewScale.current = 1;

                point.x = (point.x << 1);
                point.y = (point.y << 1);
            }
        }

        return point;
    };

    const updatePreviewObjectBoundingRectangle = (point: PointData) => {
        const room = roomRef.current;

        if (!room) return;

        const bounds = room.getRoomObjectBoundingRectangle(PREVIEW_OBJECT_ID, currentObjectCategory.current);

        if (!bounds) return;

        bounds.x += -(currentPreviewWidth.current >> 1);
        bounds.y += -(currentPreviewHeight.current >> 1);

        bounds.x += -(point.x);
        bounds.y += -(point.y);

        if (!currentPreviewRectangle.current) {
            currentPreviewRectangle.current = bounds;
        }
        else {
            const expandedBounds = currentPreviewRectangle.current.clone().enlarge(bounds);

            if (((((expandedBounds.width - currentPreviewRectangle.current.width) > ((currentPreviewWidth.current - currentPreviewRectangle.current.width) >> 1)) || ((expandedBounds.height - currentPreviewRectangle.current.height) > ((currentPreviewHeight.current - currentPreviewRectangle.current.height) >> 1))) || (currentPreviewRectangle.current.width < 1)) || (currentPreviewRectangle.current.height < 1)) currentPreviewRectangle.current = expandedBounds;
        }
    };

    const updateRoomPreview = () => {
        const room = roomRef.current;

        if (!room) return;

        let offset = room.getRoomInstanceRenderingCanvasOffset();

        updatePreviewObjectBoundingRectangle(offset);

        if (!currentPreviewRectangle.current) return;

        const scale = currentPreviewScale.current;

        offset = validatePreviewSize(offset);

        const canvasOffset = getCanvasOffset(offset);

        if (canvasOffset) room.setRoomInstanceRenderingCanvasOffset(canvasOffset);

        if (currentPreviewScale.current !== scale) currentPreviewRectangle.current = null;
    };

    const removePreviewObjects = (room: IRoom) => {
        room.removeRoomObjectFloor(PREVIEW_OBJECT_ID);
        room.removeRoomObjectWall(PREVIEW_OBJECT_ID);
        room.removeRoomObjectUser(PREVIEW_OBJECT_ID);
    };

    const resetRoomPreview = (flag: boolean) => {
        const room = roomRef.current;

        if (!room) return;

        removePreviewObjects(room);

        if (!flag) updateRoomPreview();

        currentObjectCategory.current = RoomObjectCategoryEnum.Minimum;
        currentPreviewRectangle.current = null;
        needsZoomOut.current = false;
        automaticStateChange.current = false;
        currentAvatarAction.current = PREVIEW_AVATAR_ACTION_STAND;
        setCanRotatePreview(false);
    };

    const addFurnitureIntoRoom = (classId: number, direction: IVector3D, objectData?: IObjectData, extra: number = NaN) => {
        const room = roomRef.current;

        if (!room) return;

        if (currentObjectCategory.current === RoomObjectCategoryEnum.Floor && currentPreviewClassId.current === classId) return PREVIEW_OBJECT_ID;

        if (!objectData) objectData = new LegacyDataType();

        resetRoomPreview(false);

        currentPreviewClassId.current = classId;
        currentPreviewExtraParam.current = '';
        currentObjectCategory.current = RoomObjectCategoryEnum.Floor;

        if (room.addFurnitureFloorByTypeId(PREVIEW_OBJECT_ID, classId, PREVIEW_OBJECT_LOCATION, direction, 0, objectData, NaN, -1, FurnitureUsagePolicyEnum.Nobody, 0, '', false, -1)) {
            const roomObject = room.getRoomObject(PREVIEW_OBJECT_ID, currentObjectCategory.current);

            if (roomObject) {
                if (!Number.isNaN(extra)) roomObject.model.setValue(RoomObjectVariableEnum.FurnitureExtras, extra);

                applyInvisibleLayerState(roomObject);
            }

            currentPreviewRectangle.current = null;
            needsZoomOut.current = false;
            startAutomaticStateChange();
            setCanRotatePreview(canRotatePreviewObject());
            updateRoomPreview();

            return PREVIEW_OBJECT_ID;
        }

        currentObjectCategory.current = RoomObjectCategoryEnum.Minimum;

        return -1;
    };

    const addWallItemIntoRoom = (classId: number, direction: IVector3D, data: string = '') => {
        const room = roomRef.current;

        if (!room) return;

        if (currentObjectCategory.current === RoomObjectCategoryEnum.Wall && currentPreviewClassId.current === classId && currentPreviewExtraParam.current === data) return PREVIEW_OBJECT_ID;

        resetRoomPreview(false);

        currentPreviewClassId.current = classId;
        currentPreviewExtraParam.current = data;
        currentObjectCategory.current = RoomObjectCategoryEnum.Wall;

        if (room.addFurnitureWallByTypeId(PREVIEW_OBJECT_ID, classId, PREVIEW_WALL_ITEM_LOCATION, direction, 0, data, -1, FurnitureUsagePolicyEnum.Nobody, 0, '', false)) {
            const roomObject = room.getRoomObject(PREVIEW_OBJECT_ID, currentObjectCategory.current);

            if (roomObject) {
                applyInvisibleLayerState(roomObject);
                updatePreviewWallItemLocation(roomObject);
            }

            currentPreviewRectangle.current = null;
            needsZoomOut.current = false;
            startAutomaticStateChange();
            setCanRotatePreview(canRotatePreviewObject());
            updateRoomPreview();

            return PREVIEW_OBJECT_ID;
        }

        currentObjectCategory.current = RoomObjectCategoryEnum.Minimum;

        return -1;
    };

    const addAvatarIntoRoom = (figure: string, effect: number = 0) => {
        const room = roomRef.current;

        if (!room || !figure) return -1;

        resetRoomPreview(false);

        currentPreviewClassId.current = 1;
        currentPreviewExtraParam.current = figure;
        currentObjectCategory.current = RoomObjectCategoryEnum.Unit;

        if (!room.addRoomObjectUser(PREVIEW_OBJECT_ID, PREVIEW_OBJECT_LOCATION, new Vector3d(90), 135, RoomObjectUserType.User, figure)) {
            currentObjectCategory.current = RoomObjectCategoryEnum.Minimum;
            return -1;
        }

        room.updateRoomObjectUserGesture(PREVIEW_OBJECT_ID, 1);
        room.updateRoomObjectUserEffect(PREVIEW_OBJECT_ID, effect);
        room.updateRoomObjectUserPosture(PREVIEW_OBJECT_ID, 'std');

        currentPreviewRectangle.current = null;
        needsZoomOut.current = false;
        automaticStateChange.current = false;
        currentAvatarAction.current = PREVIEW_AVATAR_ACTION_STAND;
        setCanRotatePreview(canRotatePreviewObject());
        updateRoomPreview();

        return PREVIEW_OBJECT_ID;
    };

    useEffect(() => {
        const room = GetRoomEngine().createRoom(RoomId.makeRoomPreviewerId(roomId));

        roomRef.current = room;

        const onRoomObjectAdded = (event: RoomEngineObjectEvent) => {
            if (event.roomId !== room.roomId || event.objectId !== PREVIEW_OBJECT_ID || event.category !== currentObjectCategory.current) return;

            currentPreviewRectangle.current = null;
            needsZoomOut.current = false;

            const roomObject = room.getRoomObject(event.objectId, event.category);

            applyInvisibleLayerState(roomObject);

            if (roomObject && event.category === RoomObjectCategoryEnum.Wall) updatePreviewWallItemLocation(roomObject);
        };
        const removeAddedListener = room.eventDispatcher.addEventListener<RoomEngineObjectEvent>(
            RoomEngineObjectEvent.ADDED,
            onRoomObjectAdded,
        );
        const removeContentUpdatedListener = room.eventDispatcher.addEventListener<RoomEngineObjectEvent>(
            RoomEngineObjectEvent.CONTENT_UPDATED,
            onRoomObjectAdded,
        );

        if (!room.isInitialized) {
            const map = createMapForSize(7);

            if (map.wallGeometry) room.setLegacyGeometry(map.wallGeometry);

            if (map.mapData) room.applyRoomMap(map.mapData);

            resetRoomPreviewPlaneTypes();
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsReady(true);

        return () => {
            removeAddedListener?.();
            removeContentUpdatedListener?.();
            removePreviewObjects(room);

            if (roomRef.current === room) roomRef.current = undefined;
        }
    }, [roomId]);

    useEffect(() => {
        const room = roomRef.current;

        if (!room || !isReady) return;

        const element = canvasRef.current;
        const parent = element?.parentElement;

        if (!element || !parent) return;

        const ticker = GetTicker();
        let isCanvasInitialized = false;

        const handleSize = (width: number, height: number) => {
            width = Math.max(1, width);
            height = Math.max(1, height);

            let previewCanvas = room.canvas;

            if (!previewCanvas) {
                previewCanvas = room.getRoomCanvas(width, height, RoomGeometryScaleType.ZoomedIn);
            }
            else {
                previewCanvas.initialize(width, height);
            }

            if (!isCanvasInitialized) {
                previewCanvas.setMask(true);
                previewCanvas.setScale(1);
                previewCanvas.geometry.adjustLocation(PREVIEW_OBJECT_LOCATION, PREVIEW_CAMERA_DISTANCE);

                currentPreviewRectangle.current = null;
                currentPreviewScale.current = 1;
                needsZoomOut.current = false;
                isCanvasInitialized = true;
            }

            currentPreviewWidth.current = width;
            currentPreviewHeight.current = height;

            element.width = width;
            element.height = height;
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;

            if (room.canvas) room.canvas.canvasElement = element;
        };

        let timer: ReturnType<typeof setTimeout>;

        const observer = new ResizeObserver(x => {
            const width = ~~x[0]?.contentRect.width;
            const height = ~~x[0]?.contentRect.height;

            clearTimeout(timer);

            timer = setTimeout(() => handleSize(width, height), 5);
        });

        const tick = (ticker: Ticker) => {
            if (!room.canvas?.master) return;

            const time = ticker.lastTime;
            const update = false;

            room.update(time, update);
            updateAutomaticStateChange(time);

            if (currentObjectCategory.current === RoomObjectCategoryEnum.Wall) {
                const roomObject = room.getRoomObject(PREVIEW_OBJECT_ID, RoomObjectCategoryEnum.Wall);

                if (roomObject) updatePreviewWallItemLocation(roomObject);
            }

            setCanRotatePreview(canRotatePreviewObject());
            updateRoomPreview();

            TextureUtils.renderToCanvas(room.canvas.master, element);
        };

        const rect = parent.getBoundingClientRect();

        handleSize(~~rect.width, ~~rect.height);
        observer.observe(parent);
        ticker.add(tick);

        return () => {
            observer.disconnect();
            if (timer) clearTimeout(timer);
            ticker.remove(tick);
            TextureUtils.releaseCanvas(element);

            if (room.canvas?.canvasElement === element) room.canvas.canvasElement = undefined;
        }
    }, [roomId, isReady]);

    return {
        isReady,
        canRotate,
        addFurnitureIntoRoom,
        addWallItemIntoRoom,
        addAvatarIntoRoom,
        resetRoomPreview,
        rotatePreviewObject,
        cyclePreviewAvatarAction,
        changePreviewObjectState,
        setAddViewOffset,
        updateRoomPreviewPlaneTypes,
        resetRoomPreviewPlaneTypes
    };
};
