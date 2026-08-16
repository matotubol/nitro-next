import { useRef } from 'react';

import { useCatalogSelectors } from '#base/context';
import { useCatalogOfferActions, useCatalogProductPreview } from '#base/hooks';
import { BitmapText, ContainerButton } from '#base/theme';

export const CatalogProductViewWidgetView = () => {
    const { activeOffer } = useCatalogSelectors();
    const { getOfferProduct } = useCatalogOfferActions();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const product = activeOffer ? getOfferProduct(activeOffer) : undefined;
    const productName =
        product?.productData?.name || product?.furnitureData?.localizedName || '';
    const {
        isAvatarPreview,
        isZoomed,
        canRotate,
        rotatePreviewObject,
        cyclePreviewAvatarAction,
        changePreviewObjectState,
        toggleZoom,
    } = useCatalogProductPreview(product, canvasRef);
    const canvasClassName = [
        'catalog-product-preview-canvas',
        isAvatarPreview && 'is-avatar',
        isZoomed && 'is-zoomed',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="relative flex overflow-hidden size-full bg-black">
            <canvas
                key="catalog-room-preview"
                ref={canvasRef}
                className={canvasClassName}
                onClick={() => changePreviewObjectState()}
            />
            {activeOffer && (
                <>
                    <BitmapText
                        recipe="bold-12"
                        color="#ffffff"
                        className="catalog-product-preview-name"
                    >
                        {productName}
                    </BitmapText>
                    <div className="catalog-product-preview-rotation-controls">
                        <ContainerButton
                            variant="5"
                            type="button"
                            aria-label="Rotate preview left"
                            className="catalog-product-preview-rotate-button is-left"
                            disabled={!canRotate}
                            onClick={() => rotatePreviewObject(false)}
                        >
                            <span className="habbo-icon icon-arrow-left" />
                        </ContainerButton>
                        <ContainerButton
                            variant="5"
                            type="button"
                            aria-label="Rotate preview right"
                            className="catalog-product-preview-rotate-button is-right"
                            disabled={!canRotate}
                            onClick={() => rotatePreviewObject(true)}
                        >
                            <span className="habbo-icon icon-arrow-right" />
                        </ContainerButton>
                    </div>
                    {isAvatarPreview && (
                        <>
                            <button
                                type="button"
                                className="catalog-product-preview-zoom-button"
                                aria-label={
                                    isZoomed ? 'Zoom preview out' : 'Zoom preview in'
                                }
                                aria-pressed={isZoomed}
                                onClick={toggleZoom}
                            >
                                <span className="icon-zoom-more" />
                            </button>
                            <button
                                type="button"
                                className="catalog-product-preview-action-button"
                                aria-label="Cycle preview animation"
                                onClick={cyclePreviewAvatarAction}
                            >
                                <span className="catalog-product-preview-action-icon" />
                            </button>
                        </>
                    )}
                </>
            )}
        </div>
    );
};
