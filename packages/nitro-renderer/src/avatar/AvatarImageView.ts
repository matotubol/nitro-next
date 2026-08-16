import { AvatarGeometryType, AvatarScaleType, AvatarSetType, type IAvatarImage } from '@nitrodevco/nitro-api';
import type { ImageLike, RenderTexture } from 'pixi.js';
import { Container, Rectangle, Sprite } from 'pixi.js';

import { GetRenderer, TexturePool } from '#renderer/utils';

export type AvatarImageViewType = 'face' | 'imager';

export interface AvatarImageViewOptions {
    type: AvatarImageViewType;
    setType?: AvatarSetType;
    scale?: number;
}

/** Renders fixed Habbo viewports without changing avatar asset registration. */
export class AvatarImageView {
    private static readonly FACE_SIZE = 50;
    private static readonly FACE_OFFSETS: Partial<Record<number, { x: number; y: number }>> = {
        2: { x: 21, y: 28 },
        3: { x: 21, y: 30 },
    };

    public static async renderImage(avatar: IAvatarImage, options: AvatarImageViewOptions): Promise<ImageLike | undefined> {
        const texture = this.createTexture(avatar, options);

        if (!texture) return undefined;

        try {
            return await GetRenderer().extract.image(texture);
        } finally {
            TexturePool.releaseTexture(texture);
        }
    }

    public static async renderBase64(avatar: IAvatarImage, options: AvatarImageViewOptions): Promise<string | undefined> {
        const texture = this.createTexture(avatar, options);

        if (!texture) return undefined;

        try {
            return await GetRenderer().extract.base64(texture);
        } finally {
            TexturePool.releaseTexture(texture);
        }
    }

    private static createTexture(avatar: IAvatarImage, options: AvatarImageViewOptions): RenderTexture | undefined {
        const setType = options.setType ?? AvatarSetType.Full;
        const source = avatar.getImage(setType, false, 1);

        if (!source) return undefined;

        const frame = options.type === 'face'
            ? this.getFaceFrame(avatar)
            : this.getImagerFrame(avatar, setType);

        if (!frame) return undefined;

        const scale = Number.isFinite(options.scale) && (options.scale ?? 0) > 0 ? options.scale! : 1;
        const target = TexturePool.createRenderTexture(Math.round(frame.width * scale), Math.round(frame.height * scale));

        if (!target) return undefined;

        const container = options.type === 'imager' && setType === AvatarSetType.Full
            ? this.createAvatarContainer(avatar, source)
            : new Container({ children: [new Sprite(source)] });

        container.position.set(-frame.x * scale, -frame.y * scale);
        container.scale.set(scale);

        try {
            GetRenderer().render({ target, container, clear: true });
        } catch (error) {
            TexturePool.releaseTexture(target);

            throw error;
        } finally {
            this.disposeContainer(container);
        }

        return target;
    }

    private static getFaceFrame(avatar: IAvatarImage): Rectangle | undefined {
        if (avatar.getScale() !== AvatarScaleType.Large) return undefined;

        const offset = this.FACE_OFFSETS[avatar.getDirection()];

        if (!offset) return undefined;

        return new Rectangle(offset.x, offset.y, this.FACE_SIZE, this.FACE_SIZE);
    }

    private static getImagerFrame(avatar: IAvatarImage, setType: AvatarSetType): Rectangle {
        if (setType === AvatarSetType.Head) {
            return avatar.getScale() === AvatarScaleType.Small
                ? new Rectangle(9, 18, 27, 30)
                : new Rectangle(19, 22, 54, 62);
        }

        const isSmall = avatar.getScale() === AvatarScaleType.Small;
        const isHorizontal = avatar.mainAction.definition?.geometryType === AvatarGeometryType.Horizontal;
        const width = isHorizontal ? (isSmall ? 56 : 110) : (isSmall ? 33 : 64);
        const height = isHorizontal ? (isSmall ? 33 : 64) : (isSmall ? 56 : 110);

        if (isHorizontal) return new Rectangle(isSmall ? 10 : 17, isSmall ? 6 : 12, width, height);

        return new Rectangle(isSmall ? 7 : 13, isSmall ? 12 : 14, width, height);
    }

    private static createAvatarContainer(avatar: IAvatarImage, source: RenderTexture): Container {
        const behind = new Container();
        const front = new Container();
        const body = new Sprite(source);
        const container = new Container({ children: [behind, body, front] });
        const direction = avatar.getDirection();
        const isSmall = avatar.getScale() === AvatarScaleType.Small;
        const avatarSize = isSmall ? 32 : 64;
        const canvasBottom = source.height - (isSmall ? 8 : 16);
        const canvasRegX = (source.width - avatarSize) / 2;

        for (const spriteData of avatar.getSprites()) {
            const layerData = avatar.getLayerData(spriteData);
            let offsetX = spriteData.getDirectionOffsetX(direction);
            let offsetY = spriteData.getDirectionOffsetY(direction);

            if (layerData) {
                offsetX += layerData.dx;
                offsetY += layerData.dy;
            }

            if (isSmall) {
                offsetX /= 2;
                offsetY /= 2;
            }

            if (spriteData.id === 'avatar') {
                body.position.set(offsetX, offsetY);

                continue;
            }

            let frame = 0;
            let assetDirection = spriteData.hasDirections ? direction : 0;

            if (layerData) {
                frame = layerData.animationFrame;
                assetDirection += layerData.dd;
            }

            assetDirection = (assetDirection % 8 + 8) % 8;

            const asset = avatar.getAsset(`${avatar.getScale()}_${spriteData.member}_${assetDirection}_${frame}`);

            if (!asset?.texture) continue;

            const sprite = new Sprite(asset.texture);

            sprite.position.set(asset.offsetX + canvasRegX + offsetX, asset.offsetY + canvasBottom + offsetY);

            if (asset.flipH) {
                sprite.scale.x = -1;
                sprite.x += asset.width;
            }

            if (asset.flipV) {
                sprite.scale.y = -1;
                sprite.y += asset.height;
            }

            if (spriteData.ink === 33) sprite.blendMode = 'add';

            (spriteData.getDirectionOffsetZ(direction) < 0 ? behind : front).addChild(sprite);
        }

        return container;
    }

    private static disposeContainer(container: Container): void {
        const destroyChildren = (target: Container) => {
            for (const child of target.removeChildren()) {
                if (child instanceof Container) destroyChildren(child);

                child.destroy();
            }
        };

        destroyChildren(container);
        container.destroy();
    }
}
