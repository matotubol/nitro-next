import {
    AvatarFigurePartType,
    AvatarGenderType,
    AvatarScaleType,
    AvatarSetType,
    type IFigurePart,
    type IFigurePartSet,
    type IGraphicAsset,
} from '@nitrodevco/nitro-api';
import type { ImageLike } from 'pixi.js';
import { Container, Sprite } from 'pixi.js';

import { GetRenderer, TexturePool } from '#renderer/utils';

import { GetAvatarRenderManager } from './GetAvatarRenderManager';

type PartAsset = {
    part: IFigurePart;
    asset: IGraphicAsset;
};

/** Renders the raw layers of one figure part set without completing a full avatar. */
export class AvatarPartImageView {
    private static readonly THUMB_DIRECTIONS = [2, 6, 0, 4, 3, 1];

    private static readonly DRAW_ORDER = [
        'li',
        'lh',
        'ls',
        'lc',
        'mcl',
        'ptl',
        'bd',
        'sh',
        'lg',
        'ch',
        'ca',
        'cc',
        'cp',
        'mc',
        'pt',
        'wa',
        'rh',
        'rs',
        'rc',
        'mcr',
        'ptr',
        'hd',
        'fc',
        'ey',
        'hr',
        'hrb',
        'fa',
        'ea',
        'ha',
        'he',
        'ri',
    ];

    public static async renderImage(
        partSet: IFigurePartSet,
        colorIds: readonly number[],
    ): Promise<ImageLike | undefined> {
        if (partSet.type === AvatarFigurePartType.Head) {
            return this.renderHeadImage(partSet, colorIds);
        }

        const manager = GetAvatarRenderManager();
        const figure = manager.createFigureContainer(
            `${partSet.type}-${partSet.id}`,
        );

        if (!manager.isFigureContainerReady(figure)) {
            await manager.downloadAvatarFigureAsync(figure);
        }

        const direction = this.findDirection(partSet);

        if (direction === undefined) return undefined;

        const partAssets = partSet.parts
            .slice()
            .sort((left, right) => this.sortParts(left, right))
            .map(part => {
                const asset = manager.getAssetByName(
                    this.getAssetName(part, direction),
                );

                return asset?.texture ? { part, asset } : undefined;
            })
            .filter((item): item is PartAsset => !!item);

        if (!partAssets.length) return undefined;

        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const { asset } of partAssets) {
            const x = asset.x;
            const y = asset.y;

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + asset.width);
            maxY = Math.max(maxY, y + asset.height);
        }

        const width = Math.max(1, Math.ceil(maxX - minX));
        const height = Math.max(1, Math.ceil(maxY - minY));
        const target = TexturePool.createRenderTexture(width, height);

        if (!target) return undefined;

        const container = new Container();
        const setType = manager.structureData.getSetType(partSet.type);
        const palette = setType
            ? manager.structureData.getPalette(setType.paletteId)
            : undefined;

        for (const { part, asset } of partAssets) {
            if (!asset.texture) continue;

            const sprite = new Sprite(asset.texture);

            sprite.position.set(asset.x - minX, asset.y - minY);

            if (part.colorLayerIndex > 0) {
                const colorId = colorIds[part.colorLayerIndex - 1];
                const color = colorId ? palette?.getColor(colorId) : undefined;

                if (color) sprite.tint = color.rgb;
            }

            container.addChild(sprite);
        }

        try {
            GetRenderer().render({ target, container, clear: true });

            return await GetRenderer().extract.image(target);
        } finally {
            for (const child of container.removeChildren()) child.destroy();

            container.destroy();
            TexturePool.releaseTexture(target);
        }
    }

    /** Renders an `hd` set through the full avatar pipeline, cropped to the head, like the official client. */
    private static async renderHeadImage(
        partSet: IFigurePartSet,
        colorIds: readonly number[],
    ): Promise<ImageLike | undefined> {
        const manager = GetAvatarRenderManager();
        const colors = colorIds.length ? `-${colorIds.join('-')}` : '';
        const figure = `${AvatarFigurePartType.Head}-${partSet.id}${colors}`;

        // No gender on purpose: validation would inject default mandatory parts,
        // while the thumbnail must stay an `hd`-only figure.
        const avatar = await manager.createAvatarImageAsync(
            figure,
            AvatarScaleType.Large,
            undefined as unknown as AvatarGenderType,
        );

        if (!avatar) return undefined;

        try {
            avatar.setDirection(AvatarSetType.Full, 2);
            avatar.setDirection(AvatarSetType.Head, 2);

            return await avatar.getCroppedImageAsync(AvatarSetType.Head, false, 1);
        } finally {
            avatar.dispose();
        }
    }

    private static findDirection(partSet: IFigurePartSet): number | undefined {
        const manager = GetAvatarRenderManager();

        for (const part of partSet.parts) {
            for (const direction of this.THUMB_DIRECTIONS) {
                if (manager.getAssetByName(this.getAssetName(part, direction))?.texture) {
                    return direction;
                }
            }
        }

        return undefined;
    }

    private static getAssetName(part: IFigurePart, direction: number): string {
        return `h_std_${part.type}_${part.id}_${direction}_0`;
    }

    private static sortParts(left: IFigurePart, right: IFigurePart): number {
        const drawOrder =
            AvatarPartImageView.DRAW_ORDER.indexOf(left.type) -
            AvatarPartImageView.DRAW_ORDER.indexOf(right.type);

        return drawOrder || left.index - right.index;
    }
}
