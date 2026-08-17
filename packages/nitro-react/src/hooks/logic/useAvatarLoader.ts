import type { IEffectMapLibrary, IFigureData, IFigureMapLibrary } from '@nitrodevco/nitro-api';
import { NitroLogger } from '@nitrodevco/nitro-api';
import { GetAvatarRenderManager } from '@nitrodevco/nitro-renderer';
import { useEffect, useState } from 'react';

import { useConfigValue } from '#base/context';

export const useAvatarLoader = () => {
    const [isAvatarReady, setIsAvatarReady] = useState(false);
    const figureMapUrl = useConfigValue<string>('figuremap.url') ?? '';
    const effectMapUrl = useConfigValue<string>('effectmap.url') ?? '';
    const avatarAssetUrl = useConfigValue<string>('asset.urls.avatar') ?? '';
    const effectAssetUrl = useConfigValue<string>('asset.urls.effect') ?? '';
    const figureDataUrl = useConfigValue<string>('figuredata.url') ?? '';

    useEffect(() => {
        setIsAvatarReady(false);

        if (!figureMapUrl || !effectMapUrl || !figureDataUrl || !avatarAssetUrl || !effectAssetUrl) return;

        const abortController = new AbortController();
        const manager = GetAvatarRenderManager();

        const fetchJson = async <T>(url: string, label: string): Promise<T> => {
            const response = await fetch(url, { signal: abortController.signal });

            if (!response.ok) throw new Error(`Invalid ${label} url (${response.status})`);

            return response.json() as Promise<T>;
        };

        const load = async () => {
            try {
                manager.init();

                const [figureMap, effectMap, figureData] = await Promise.all([
                    fetchJson<{ libraries: IFigureMapLibrary[] }>(figureMapUrl, 'figuremap'),
                    fetchJson<{ effects: IEffectMapLibrary[] }>(effectMapUrl, 'effectmap'),
                    fetchJson<IFigureData>(figureDataUrl, 'figuredata'),
                ]);

                if (abortController.signal.aborted) return;

                // Figure data must exist before either map can release queued avatar requests.
                manager.structure.injectFigureData(figureData);
                manager.processFigureMap(figureMap.libraries, avatarAssetUrl);
                manager.processEffectMap(effectMap.effects, effectAssetUrl);
                setIsAvatarReady(manager.isReady);
            } catch (error) {
                if (!abortController.signal.aborted) NitroLogger.error(error);
            }
        };

        void load();

        return () => abortController.abort();
    }, [figureMapUrl, effectMapUrl, figureDataUrl, avatarAssetUrl, effectAssetUrl]);

    return { isAvatarReady };
};
