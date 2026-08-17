import 'dotenv/config';
import '@pixi/node';

import type { IEffectMapLibrary, IFigureData, IFigureMapLibrary } from '@nitrodevco/nitro-api';
import { NitroLogger } from '@nitrodevco/nitro-api';
import { GetAvatarRenderManager } from '@nitrodevco/nitro-renderer';

export const AvatarLoader = async () => {
    const figureMapUrl = process.env.FIGUREMAP_URL;
    const effectMapUrl = process.env.EFFECTMAP_URL;
    const figureDataUrl = process.env.FIGUREDATA_URL;
    const avatarAssetUrl = process.env.AVATAR_ASSET_URL;
    const effectAssetUrl = process.env.EFFECT_ASSET_URL;

    if (!figureMapUrl || !effectMapUrl || !figureDataUrl || !avatarAssetUrl || !effectAssetUrl) {
        throw new Error('FIGUREMAP_URL, EFFECTMAP_URL, FIGUREDATA_URL, AVATAR_ASSET_URL and EFFECT_ASSET_URL are required');
    }

    const fetchJson = async <T>(url: string, label: string): Promise<T> => {
        const response = await fetch(url);

        if (!response.ok) throw new Error(`Invalid ${label} url (${response.status})`);

        return response.json() as Promise<T>;
    };

    try {
        const manager = GetAvatarRenderManager();

        manager.init();

        const [figureMap, effectMap, figureData] = await Promise.all([
            fetchJson<{ libraries: IFigureMapLibrary[] }>(figureMapUrl, 'figuremap'),
            fetchJson<{ effects: IEffectMapLibrary[] }>(effectMapUrl, 'effectmap'),
            fetchJson<IFigureData>(figureDataUrl, 'figuredata'),
        ]);

        manager.structure.injectFigureData(figureData);
        manager.processFigureMap(figureMap.libraries, avatarAssetUrl);
        manager.processEffectMap(effectMap.effects, effectAssetUrl);

        if (!manager.isReady) throw new Error('Avatar renderer did not become ready');

        NitroLogger.log('Avatar data loaded');
    } catch (err) {
        NitroLogger.error(err);

        throw err;
    }
};
