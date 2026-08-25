import type { IFigurePartSet } from '@nitrodevco/nitro-api';
import { AvatarPartImageView } from '@nitrodevco/nitro-renderer';
import { useEffect, useMemo, useState } from 'react';

type AvatarPartImageProps = {
    partSet: IFigurePartSet;
    colorIds: readonly number[];
};

type RenderedPart = {
    width: number;
    height: number;
    url: string;
};

const MAX_CACHED_PARTS = 256;
const imageCache = new Map<string, Promise<RenderedPart | undefined>>();

const getPartImage = (
    key: string,
    partSet: IFigurePartSet,
    colorIds: readonly number[],
) => {
    const cached = imageCache.get(key);

    if (cached) {
        imageCache.delete(key);
        imageCache.set(key, cached);

        return cached;
    }

    while (imageCache.size >= MAX_CACHED_PARTS) {
        const oldestKey = imageCache.keys().next().value;

        if (oldestKey === undefined) break;

        imageCache.delete(oldestKey);
    }

    const rendered = AvatarPartImageView.renderImage(partSet, colorIds)
        .then(image =>
            image
                ? { width: image.width, height: image.height, url: image.src }
                : undefined,)
        .catch(() => undefined);

    imageCache.set(key, rendered);

    void rendered.then(image => {
        if (!image && imageCache.get(key) === rendered) imageCache.delete(key);
    });

    return rendered;
};

export const AvatarPartImage = ({
    partSet,
    colorIds,
}: AvatarPartImageProps) => {
    const colorKey = colorIds.join('-');
    const stableColorIds = useMemo(
        () => colorKey.split('-').filter(Boolean).map(Number),
        [colorKey],
    );
    const cacheKey = `${partSet.type}:${partSet.id}:${colorKey}`;
    const [rendered, setRendered] = useState<{
        key: string;
        image: RenderedPart | undefined;
    }>();

    useEffect(() => {
        let active = true;

        void getPartImage(cacheKey, partSet, stableColorIds).then(image => {
            if (active) setRendered({ key: cacheKey, image });
        });

        return () => {
            active = false;
        };
    }, [cacheKey, partSet, stableColorIds]);

    // Keep this part set's last render on screen while a recolour is in flight.
    // Dropping to null empties every cell in the grid on each palette click; the
    // colour suffix is ignored on purpose, but a different part set must never
    // show a stale image.
    const image = rendered?.key.startsWith(`${partSet.type}:${partSet.id}:`)
        ? rendered.image
        : undefined;

    if (!image) return null;

    return (
        <div
            className="pixel-art pointer-events-none"
            style={{
                width: image.width,
                height: image.height,
                backgroundImage: `url(${image.url})`,
                backgroundRepeat: 'no-repeat',
            }}
        />
    );
};
