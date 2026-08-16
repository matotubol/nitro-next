import {
    FurnitureSpecialType,
    FurnitureTypeEnum,
    IProduct,
    RoomId,
    Vector3d,
} from '@nitrodevco/nitro-api';
import {
    GetAvatarRenderManager,
    GetRoomContentLoader,
} from '@nitrodevco/nitro-renderer';
import { RefObject, useEffect, useState } from 'react';

import { useOwnUserLook } from '#base/context';

import { useRoomPreviewer } from '../room/useRoomPreviewer';

const CATALOG_ROOM_PREVIEW_OPTIONS = { centerWallItems: true } as const;

export type CatalogProductPreviewMode =
    | 'none'
    | 'avatar'
    | 'robot'
    | 'floor-item'
    | 'wall-item'
    | 'room-surface';

const getProductPreviewMode = (
    product: IProduct | undefined,
): CatalogProductPreviewMode => {
    if (!product) return 'none';

    if (product.productType === FurnitureTypeEnum.Effect) return 'avatar';
    if (product.productType === FurnitureTypeEnum.Robot) return 'robot';

    if (product.productType === FurnitureTypeEnum.Floor) {
        return product.furnitureData?.specialType ===
            FurnitureSpecialType.FigurePurchasableSet
            ? 'avatar'
            : 'floor-item';
    }

    if (product.productType === FurnitureTypeEnum.Wall) {
        switch (product.furnitureData?.specialType) {
            case FurnitureSpecialType.Floor:
            case FurnitureSpecialType.WallPaper:
            case FurnitureSpecialType.Landscape:
                return 'room-surface';
            default:
                return 'wall-item';
        }
    }

    return 'none';
};

type CatalogProductPreviewZoomState = {
    productKey: string;
    isZoomed: boolean;
};

const getProductKey = (product: IProduct | undefined) => {
    if (!product) return 'none';

    return `${product.productType}:${product.classId}:${product.extraParam}`;
};

export const useCatalogProductPreview = (
    product: IProduct | undefined,
    canvasRef: RefObject<HTMLCanvasElement | null>,
) => {
    const previewMode = getProductPreviewMode(product);
    const productKey = getProductKey(product);
    const [zoomState, setZoomState] = useState<CatalogProductPreviewZoomState>({
        productKey,
        isZoomed: true,
    });
    const {
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
        resetRoomPreviewPlaneTypes,
    } = useRoomPreviewer(
        RoomId.TEMP_ROOM_CATALOG,
        canvasRef,
        CATALOG_ROOM_PREVIEW_OPTIONS,
    );
    const { ownFigure, ownGender } = useOwnUserLook();
    const isAvatarPreview = previewMode === 'avatar';
    const isZoomed =
        isAvatarPreview &&
        (zoomState.productKey === productKey ? zoomState.isZoomed : true);

    useEffect(() => {
        // The Flash client resets avatar previews to 2x whenever the selected product changes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setZoomState(current => {
            if (current.productKey === productKey && current.isZoomed) return current;

            return { productKey, isZoomed: true };
        });
    }, [productKey]);

    useEffect(() => {
        if (!isReady) return;

        setAddViewOffset({ x: 0, y: product?.isUnique ? -15 : 0 });
        resetRoomPreviewPlaneTypes();

        if (!product) {
            resetRoomPreview(false);
            return;
        }

        switch (product.productType) {
            case FurnitureTypeEnum.Floor: {
                if (!product.furnitureData) {
                    resetRoomPreview(false);
                    break;
                }

                if (
                    product.furnitureData.specialType ===
                    FurnitureSpecialType.FigurePurchasableSet
                ) {
                    const avatarRenderManager = GetAvatarRenderManager();
                    const figureSetIds = product.furnitureData.customParams
                        .split(',')
                        .map(value => Number.parseInt(value, 10))
                        .filter(
                            setId =>
                                Number.isInteger(setId) &&
                                avatarRenderManager.isValidFigureSetForGender(
                                    setId,
                                    ownGender,
                                ),
                        );

                    if (!figureSetIds.length) {
                        resetRoomPreview(false);
                        break;
                    }

                    const figure = avatarRenderManager.getFigureStringWithFigureIds(
                        ownFigure,
                        ownGender,
                        figureSetIds,
                    );

                    addAvatarIntoRoom(figure);
                } else {
                    addFurnitureIntoRoom(product.classId, new Vector3d(90));
                }

                break;
            }
            case FurnitureTypeEnum.Wall: {
                if (!product.furnitureData) {
                    resetRoomPreview(false);
                    break;
                }

                switch (product.furnitureData.specialType) {
                    case FurnitureSpecialType.Floor:
                        resetRoomPreview(false);
                        updateRoomPreviewPlaneTypes(product.extraParam);
                        break;
                    case FurnitureSpecialType.WallPaper:
                        resetRoomPreview(false);
                        updateRoomPreviewPlaneTypes(undefined, product.extraParam);
                        break;
                    case FurnitureSpecialType.Landscape: {
                        resetRoomPreview(false);
                        updateRoomPreviewPlaneTypes(
                            undefined,
                            undefined,
                            product.extraParam,
                        );

                        const windowTypeId =
                            GetRoomContentLoader().getFurnitureWallTypeIdForName(
                                'window_double_default',
                            );

                        if (windowTypeId > -1)
                            addWallItemIntoRoom(windowTypeId, new Vector3d(90));

                        break;
                    }
                    default:
                        addWallItemIntoRoom(
                            product.classId,
                            new Vector3d(90),
                            product.extraParam,
                        );
                        break;
                }

                break;
            }
            case FurnitureTypeEnum.Robot:
                addAvatarIntoRoom(product.extraParam);
                break;
            case FurnitureTypeEnum.Effect:
                addAvatarIntoRoom(ownFigure, product.classId);
                break;
            default:
                resetRoomPreview(false);
                break;
        }
    }, [product, isReady, ownFigure, ownGender]);

    const toggleZoom = () => {
        if (!isAvatarPreview) return;

        setZoomState(current => ({
            productKey,
            isZoomed: current.productKey === productKey ? !current.isZoomed : false,
        }));
    };

    return {
        previewMode,
        isAvatarPreview,
        isZoomed,
        canRotate: previewMode !== 'robot' && canRotate,
        rotatePreviewObject,
        cyclePreviewAvatarAction,
        changePreviewObjectState,
        toggleZoom,
    };
};
