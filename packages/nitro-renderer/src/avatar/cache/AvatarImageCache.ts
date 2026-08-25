

import type { AvatarBodyPartType, AvatarSetType, IActiveActionData, IAvatarCanvas, IAvatarImage } from '@nitrodevco/nitro-api';
import { AvatarDirectionAngle, AvatarFigurePartType, AvatarGeometryType, AvatarScaleType } from '@nitrodevco/nitro-api';
import type { RenderTexture, TextureSource } from 'pixi.js';
import { Container, Matrix, Point, Rectangle, Sprite, Texture } from 'pixi.js';

import { GetRenderer, GetTickerTime, TexturePool } from '#renderer/utils';

import type { AssetAliasCollection } from '../alias';
import { AvatarAnimationLayerData } from '../animation';
import { AvatarImageBodyPartContainer } from '../AvatarImageBodyPartContainer';
import type { AvatarImagePartContainer } from '../AvatarImagePartContainer';
import type { AvatarStructure } from '../AvatarStructure';
import { AvatarImageActionCache } from './AvatarImageActionCache';
import { AvatarImageBodyPartCache } from './AvatarImageBodyPartCache';
import { AvatarImageDirectionCache } from './AvatarImageDirectionCache';
import { ImageData } from './ImageData';

export class AvatarImageCache {
    private static DEFAULT_MAX_CACHE_STORAGE_TIME_MS: number = 60000;

    private _structure: AvatarStructure;
    private _avatar: IAvatarImage;
    private _assets: AssetAliasCollection;
    private _scale: AvatarScaleType;
    private _geometryType: AvatarGeometryType;
    private _cache: Map<AvatarBodyPartType, AvatarImageBodyPartCache> = new Map();
    private _canvas: IAvatarCanvas | undefined = undefined;
    private _defaultAction: string = 'std';
    private _unionImages: ImageData[] = [];
    private _matrix: Matrix = new Matrix();
    private _disposed: boolean = false;
    private _largeScaledSmall: boolean;

    constructor(structure: AvatarStructure, avatar: IAvatarImage, assets: AssetAliasCollection, scale: AvatarScaleType, largeScaledSmall: boolean = false) {
        this._structure = structure;
        this._avatar = avatar;
        this._assets = assets;
        this._scale = scale;
        this._largeScaledSmall = largeScaledSmall;
    }

    public dispose(): void {
        if (this._disposed) return;

        this._canvas = undefined;
        this._disposed = true;

        if (this._cache) {
            for (const cache of this._cache.values()) cache.dispose();

            this._cache.clear();
        }

        if (this._unionImages) {
            for (const image of this._unionImages) image.dispose();

            this._unionImages = [];
        }
    }

    public disposeInactiveActions(k: number = 60000): void {
        const time = GetTickerTime();

        for (const cache of this._cache.values()) cache.disposeActions(k, time);
    }

    public resetBodyPartCache(action: IActiveActionData): void {
        for (const cache of this._cache.values()) cache.setAction(action, 0);
    }

    public setDirection(setType: AvatarSetType, direction: number): void {
        const parts = this._structure.getBodyPartsUnordered(setType);

        if (parts) {
            for (const part of parts) {
                const actionCache = this.getBodyPartCache(part);

                if (!actionCache) continue;

                actionCache.direction = direction;
            }
        }
    }

    public setAction(action: IActiveActionData, time: number): void {
        for (const _local_4 of this._structure.getActiveBodyPartIds(action, this._avatar)) this.getBodyPartCache(_local_4)?.setAction(action, time);
    }

    public setGeometryType(type: AvatarGeometryType): void {
        if (this._geometryType === type) return;

        if ((this._geometryType === AvatarGeometryType.Sitting && type === AvatarGeometryType.Vertical) || (this._geometryType === AvatarGeometryType.Vertical && type === AvatarGeometryType.Sitting) || (this._geometryType === AvatarGeometryType.SnowwarsHorizontal && type === AvatarGeometryType.SnowwarsHorizontal)) {
            this._geometryType = type;
            this._canvas = undefined;

            return;
        }

        this.disposeInactiveActions(0);

        this._geometryType = type;
        this._canvas = undefined;
    }

    public getImageContainer(setType: AvatarBodyPartType, frameNumber: number): AvatarImageBodyPartContainer | undefined {
        const cache = this.getBodyPartCache(setType);
        let direction = cache.direction;
        let action = cache.action;
        let frame = frameNumber;

        if (!action?.definition) return undefined;

        if (action.definition.startFromFrameZero) frame -= action.startFrame;

        let activeAction = action;
        let removes: string[] = [];
        let layerItems: Map<AvatarFigurePartType, number> = new Map();
        const point = new Point();

        if (action.definition.isAnimation) {
            const animation = this._structure.getAnimation(`${action.definition.state}.${action.actionParameter}`);

            if (animation) {
                const layer = animation.getLayerData((frameNumber - action.startFrame), setType, action.overridingAction);

                if (layer) {
                    let dirOffset = (direction + layer.dd);

                    if (layer.dd < 0) {
                        if (dirOffset < 0) dirOffset = (8 + dirOffset);
                        else if (dirOffset > 7) dirOffset = (8 - dirOffset);
                    }
                    else if (dirOffset < 0) dirOffset = (dirOffset + 8);
                    else if (dirOffset > 7) dirOffset = (dirOffset - 8);

                    if (this._scale === AvatarScaleType.Large) {
                        point.x = layer.dx;
                        point.y = layer.dy;
                    } else {
                        point.x = (layer.dx / 2);
                        point.y = (layer.dy / 2);
                    }

                    frame = layer.animationFrame;

                    if (layer.action) action = layer.action;

                    if (layer.type === AvatarAnimationLayerData.BODYPART) {
                        if (layer.action != null) activeAction = layer.action;

                        direction = dirOffset;
                    }
                    else if (layer.type === AvatarAnimationLayerData.FX) direction = dirOffset;

                    layerItems = layer.items;
                }

                removes = animation.removeData;
            }
        }

        let actionCache = cache.getActionCache(activeAction);

        if (!actionCache) {
            actionCache = new AvatarImageActionCache();

            cache.updateActionCache(activeAction, actionCache);
        }

        let dirCache = actionCache.getDirectionCache(direction);

        if (!dirCache) {
            dirCache = new AvatarImageDirectionCache(this._structure.getParts(setType, this._avatar.getFigure(), activeAction, this._geometryType, direction, removes, this._avatar, layerItems));

            actionCache.updateDirectionCache(direction, dirCache);
        }

        let bodyPartContainer = dirCache.getImageContainer(frame);

        if (!bodyPartContainer) {
            const imagePartContainers = dirCache.getPartList();

            bodyPartContainer = this.renderBodyPart(direction, imagePartContainers, frame, action);

            if (bodyPartContainer) {
                if (bodyPartContainer.isCacheable) dirCache.updateImageContainer(bodyPartContainer, frame);
            } else {
                return undefined;
            }
        }

        const offset = this._structure.getFrameBodyPartOffset(activeAction, direction, frame, setType);

        point.x += offset.x;
        point.y += offset.y;

        bodyPartContainer.offset = point;

        return bodyPartContainer;
    }

    /**
     * Drops cached renders for the given body parts, keeping every other part warm.
     * Passing nothing clears the whole cache, which is the old behaviour.
     */
    public invalidateBodyParts(bodyParts?: AvatarBodyPartType[]): void {
        if (this._disposed || !this._cache) return;

        if (!bodyParts) {
            for (const cache of this._cache.values()) cache.dispose();

            this._cache.clear();

            return;
        }

        for (const bodyPart of bodyParts) {
            const cache = this._cache.get(bodyPart);

            if (!cache) continue;

            cache.dispose();

            this._cache.delete(bodyPart);
        }
    }

    public getBodyPartCache(k: AvatarBodyPartType): AvatarImageBodyPartCache {
        let existing = this._cache.get(k);

        if (!existing) {
            existing = new AvatarImageBodyPartCache();

            this._cache.set(k, existing);
        }

        return existing;
    }

    private renderBodyPart(direction: number, containers: AvatarImagePartContainer[], frameCount: number, action: IActiveActionData): AvatarImageBodyPartContainer | undefined {
        if (!containers || !action?.definition) return undefined;

        if (!this._canvas) this._canvas = this._structure.getCanvas(this._scale, this._geometryType);

        if (!this._canvas) return undefined;

        const isFlipped = AvatarDirectionAngle.DIRECTION_IS_FLIPPED[direction] ?? false;

        let assetPartDefinition = action.definition.assetPartDefinition;
        let isCacheable = true;

        for (let i = containers.length - 1; i >= 0; i--) {
            const container = containers[i];

            let color = 16777215;

            if ((direction === 7 && (container.partType === AvatarFigurePartType.Face || container.partType === AvatarFigurePartType.Eyes)) || (container.partType === AvatarFigurePartType.RightHandItem && container.partId === undefined)) continue;

            const partId = container.partId;
            const animationFrame = container.getFrameDefinition(frameCount);

            let partType = container.partType;
            let assetDirection = direction;

            let frameNumber = 0;
            let flipH = false;

            if (animationFrame) {
                frameNumber = animationFrame.number;

                if ((animationFrame.assetPartDefinition) && (animationFrame.assetPartDefinition !== '')) assetPartDefinition = animationFrame.assetPartDefinition;
            }
            else frameNumber = container.getFrameIndex(frameCount);

            if (isFlipped) {
                if (((assetPartDefinition === 'wav') && ((partType === AvatarFigurePartType.LeftHand || partType === AvatarFigurePartType.LeftSleeve) || (partType === AvatarFigurePartType.LeftCoatSleeve))) || ((assetPartDefinition === 'drk') && (((partType === AvatarFigurePartType.RightHand) || (partType === AvatarFigurePartType.RightSleeve)) || (partType === AvatarFigurePartType.RightCoatSleeve))) || ((assetPartDefinition === 'blw') && (partType === AvatarFigurePartType.RightHand)) || ((assetPartDefinition === 'sig') && (partType === AvatarFigurePartType.LeftHand)) || ((assetPartDefinition === 'respect') && (partType === AvatarFigurePartType.LeftHand)) || (partType === AvatarFigurePartType.RightHandItem) || (partType === AvatarFigurePartType.LeftHandItem) || (partType === AvatarFigurePartType.ChestPrint)) {
                    flipH = true;
                }
                else {
                    if (direction === 4) assetDirection = 2;
                    else if (direction === 5) assetDirection = 1;
                    else if (direction === 6) assetDirection = 0;

                    if (container.flippedPartType && container.flippedPartType !== partType) partType = container.flippedPartType;
                }
            }

            const assetScale = this._largeScaledSmall ? AvatarScaleType.Large : this._scale;
            let assetName = `${assetScale}_${assetPartDefinition}_${partType}_${partId}_${assetDirection}_${frameNumber}`;
            let asset = this._assets.getAsset(assetName);

            if (!asset) {
                assetName = `${assetScale}_${assetPartDefinition}_${partType}_${partId}_${assetDirection}_0`;
                asset = this._assets.getAsset(assetName);
            }

            if (!asset) {
                assetName = `${assetScale}_${this._defaultAction}_${partType}_${partId}_${assetDirection}_${frameNumber}`;
                asset = this._assets.getAsset(assetName);
            }

            if (!asset) {
                assetName = `${assetScale}_${this._defaultAction}_${partType}_${partId}_${assetDirection}_0`;
                asset = this._assets.getAsset(assetName);
            }

            // A miss here is permanent, not transient: AvatarRenderManager only builds a
            // real AvatarImage once every library for the figure has settled, so the
            // fallback chain above has already seen everything it will ever see. Keep the
            // body part cacheable — clearing the flag would re-render it every frame.
            if (!asset) continue;

            const texture = asset.texture;

            if (!asset?.texture) {
                isCacheable = false;
            } else {
                if (container.isColorable && container.color) color = container.color.rgb;

                const offset = new Point(-(asset.x), -(asset.y));

                if (flipH) offset.x = (offset.x + ((this._scale === AvatarScaleType.Large) ? 65 : 31));

                this._unionImages.push(new ImageData(texture, asset.rectangle, offset, flipH, color));
            }
        }

        if (!this._unionImages.length) return undefined;

        const imageData = this.createUnionImage(this._unionImages, isFlipped);
        const canvasOffset = (this._scale === AvatarScaleType.Large) ? (this._canvas.height - 16) : (this._canvas.height - 8);
        const regPoint = imageData.regPoint.clone();

        if (this._largeScaledSmall) {
            regPoint.x /= 2;
            regPoint.y /= 2;
        }

        const offset = new Point(-(regPoint.x), (canvasOffset - regPoint.y));

        if (isFlipped && (assetPartDefinition !== 'lay')) offset.x = (offset.x + ((this._scale === AvatarScaleType.Large) ? 67 : 31));

        let imageIndex = (this._unionImages.length - 1);

        while (imageIndex >= 0) {
            const _local_17 = this._unionImages.pop();

            if (_local_17) _local_17.dispose();

            imageIndex--;
        }

        if (!imageData.container) return undefined;

        let bodyPart = imageData.container;
        let ownedTexture: RenderTexture | undefined;

        if (this._largeScaledSmall) {
            ownedTexture = this.resampleBodyPart(bodyPart, imageData.rect.width, imageData.rect.height);

            if (ownedTexture) {
                bodyPart = new Container({ children: [new Sprite(ownedTexture)] });
            } else {
                bodyPart.scale.set(0.5);
            }
        }

        return new AvatarImageBodyPartContainer(bodyPart, offset, isCacheable, ownedTexture);
    }

    private convertColorToHex(k: number): string {
        let _local_2: string = (k * 0xFF).toString(16);
        if (_local_2.length < 2) {
            _local_2 = ('0' + _local_2);
        }
        return _local_2;
    }

    /** Matches Flash's smooth, rounded BitmapData resample used by the h_50 avatar scale. */
    private resampleBodyPart(container: Container, width: number, height: number): RenderTexture | undefined {
        const targetWidth = Math.max(1, Math.round(width * 0.5));
        const targetHeight = Math.max(1, Math.round(height * 0.5));
        const target = TexturePool.createRenderTexture(targetWidth, targetHeight);

        if (!target) return undefined;

        const previousScaleModes = new Map<TextureSource, TextureSource['scaleMode']>();

        for (const child of container.children) {
            if (!(child instanceof Sprite) || child.texture === Texture.EMPTY) continue;

            const source = child.texture.source;

            if (!previousScaleModes.has(source)) previousScaleModes.set(source, source.scaleMode);

            source.scaleMode = 'linear';
        }

        container.scale.set(targetWidth / width, targetHeight / height);

        try {
            GetRenderer().render({ target, container, clear: true });
        } catch (error) {
            TexturePool.releaseTexture(target);

            throw error;
        } finally {
            for (const [source, scaleMode] of previousScaleModes) source.scaleMode = scaleMode;

            container.destroy({ children: true });
        }

        return target;
    }

    private createUnionImage(images: ImageData[], isFlipped: boolean): ImageData {
        let bounds: Rectangle | undefined;

        // Seed with the first rect: enlarging an empty (0,0,0,0) rectangle
        // would drag the origin into the union and pad every body part image.
        for (const image of images) bounds = bounds ? bounds.enlarge(image.offsetRect) : image.offsetRect.clone();

        if (!bounds) bounds = new Rectangle();

        const point = new Point(-(bounds.x), -(bounds.y));
        const container = new Container();
        const sprite = new Sprite(Texture.EMPTY);

        sprite.width = bounds.width;
        sprite.height = bounds.height;

        container.addChild(sprite);

        for (const data of images) {
            if (!data) continue;

            const texture = data.texture;
            const color = data.colorTransform;
            const flipH = (!(isFlipped && data.flipH) && (isFlipped || data.flipH));
            const regPoint = point.clone();

            regPoint.x -= data.regPoint.x;
            regPoint.y -= data.regPoint.y;

            if (isFlipped) regPoint.x = (container.width - (regPoint.x + data.rect.width));

            if (flipH) {
                this._matrix.a = -1;
                this._matrix.tx = ((data.rect.x + data.rect.width) + regPoint.x);
                this._matrix.ty = (regPoint.y - data.rect.y);
            }
            else {
                this._matrix.a = 1;
                this._matrix.tx = (regPoint.x - data.rect.x);
                this._matrix.ty = (regPoint.y - data.rect.y);
            }

            const sprite = new Sprite(texture);

            sprite.tint = color;
            sprite.setFromMatrix(this._matrix);

            container.addChild(sprite);
        }

        return new ImageData(undefined, container.getLocalBounds().rectangle, point, isFlipped, 0, container);
    }
}
