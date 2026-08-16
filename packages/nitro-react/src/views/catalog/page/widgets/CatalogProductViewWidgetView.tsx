
import { FurnitureSpecialType, FurnitureTypeEnum, RoomId, Vector3d } from "@nitrodevco/nitro-api";
import { GetAvatarRenderManager, GetRoomContentLoader } from "@nitrodevco/nitro-renderer";
import { useEffect, useRef } from "react";

import { useCatalogSelectors, useOwnUserLook } from "#base/context";
import { useCatalogOfferActions, useRoomPreviewer } from "#base/hooks";
import { BitmapText, ContainerButton } from "#base/theme";

const CATALOG_ROOM_PREVIEW_OPTIONS = { centerWallItems: true } as const;

export const CatalogProductViewWidgetView = () => {
    const { activeOffer } = useCatalogSelectors();
    const { getOfferProduct } = useCatalogOfferActions();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const {
        isReady,
        canRotate,
        addFurnitureIntoRoom,
        addWallItemIntoRoom,
        addAvatarIntoRoom,
        resetRoomPreview,
        rotatePreviewObject,
        changePreviewObjectState,
        setAddViewOffset,
        updateRoomPreviewPlaneTypes,
        resetRoomPreviewPlaneTypes
    } = useRoomPreviewer(RoomId.TEMP_ROOM_CATALOG, canvasRef, CATALOG_ROOM_PREVIEW_OPTIONS);
    const { ownFigure, ownGender } = useOwnUserLook();
    const product = activeOffer ? getOfferProduct(activeOffer) : undefined;
    const productName = product?.productData?.name || product?.furnitureData?.localizedName || '';

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

                if (product.furnitureData.specialType === FurnitureSpecialType.FigurePurchasableSet) {
                    const figureSetIds = product.productData?.figureSetIds;

                    if (!figureSetIds?.length) {
                        resetRoomPreview(false);
                        break;
                    }

                    const figure = GetAvatarRenderManager().getFigureStringWithFigureIds(
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
                        updateRoomPreviewPlaneTypes(undefined, undefined, product.extraParam);

                        const windowTypeId = GetRoomContentLoader().getFurnitureWallTypeIdForName('window_double_default');

                        if (windowTypeId > -1) addWallItemIntoRoom(windowTypeId, new Vector3d(90));

                        break;
                    }
                    default:
                        addWallItemIntoRoom(product.classId, new Vector3d(90), product.extraParam);
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

    return (
        <div className="relative flex overflow-hidden size-full bg-black">
            <canvas
                key="catalog-room-preview"
                ref={canvasRef}
                className="absolute"
                onClick={() => changePreviewObjectState()} />
            {activeOffer && (
                <>
                    <BitmapText
                        recipe="bold-12"
                        color="#ffffff"
                        className="catalog-product-preview-name">
                        {productName}
                    </BitmapText>
                    <div className="catalog-product-preview-rotation-controls">
                        <ContainerButton
                            variant="5"
                            type="button"
                            aria-label="Rotate preview left"
                            className="catalog-product-preview-rotate-button is-left"
                            disabled={!canRotate}
                            onClick={() => rotatePreviewObject(false)}>
                            <span className="habbo-icon icon-arrow-left" />
                        </ContainerButton>
                        <ContainerButton
                            variant="5"
                            type="button"
                            aria-label="Rotate preview right"
                            className="catalog-product-preview-rotate-button is-right"
                            disabled={!canRotate}
                            onClick={() => rotatePreviewObject(true)}>
                            <span className="habbo-icon icon-arrow-right" />
                        </ContainerButton>
                    </div>
                </>
            )}
        </div>
    );
};
