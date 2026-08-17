import { type IAssetData, type IAssetManager, type IGraphicAsset, type IGraphicAssetCollection, NitroLogger } from '@nitrodevco/nitro-api';
import { AnimatedGIF } from '@pixi/gif';
import JSZip from 'jszip';
import type { SpritesheetData, Texture } from 'pixi.js';
import { Assets, Spritesheet } from 'pixi.js';

import { NitroBundle } from '../utils';
import { GraphicAssetCollection } from './GraphicAssetCollection';

export class AssetManager implements IAssetManager {
    private _textures: Map<string, Texture> = new Map();
    private _collections: Map<string, IGraphicAssetCollection> = new Map();
    private _assets: Map<string, IGraphicAsset> = new Map();
    private _downloadPromises: Map<string, Promise<boolean>> = new Map();

    public getTexture(name: string): Texture | undefined {
        return this._textures.get(name);
    }

    public setTexture(name: string, texture: Texture): void {
        if (!name || !texture) return;

        texture.label = name;

        this._textures.set(name, texture);
    }

    public getAsset(name: string): IGraphicAsset | undefined {
        if (!name || !name.length) return undefined;

        const cached = this._assets.get(name);

        if (cached) return cached;

        for (const collection of this._collections.values()) {
            if (!collection) continue;

            const existing = collection.getAsset(name);

            if (!existing) continue;

            this._assets.set(name, existing);

            return existing;
        }

        NitroLogger.warn(`AssetManager: Asset not found: ${name}`);

        return undefined;
    }

    public addAssetToCollection(
        collectionName: string,
        assetName: string,
        texture: Texture
    ): IGraphicAsset | undefined {
        const collection = this.getCollection(collectionName);
        const asset = collection?.addAsset(assetName, texture, 0, 0, false, false, false, true);

        if (asset) this._assets.set(assetName, asset);

        return asset ?? undefined;
    }

    public getCollection(name: string): IGraphicAssetCollection | undefined {
        return this._collections.get(name);
    }

    public createCollection(
        data: IAssetData,
        spritesheet: Spritesheet | undefined,
    ): IGraphicAssetCollection | undefined {
        if (!data) return undefined;

        const existing = this._collections.get(data.type);

        if (existing) return existing;

        const collection = new GraphicAssetCollection(data, spritesheet?.textureSource, spritesheet?.textures);

        for (const [name, texture] of collection.textures.entries()) this.setTexture(name, texture);

        for (const [name, asset] of collection.assets.entries()) {
            if (!this._assets.has(name)) this._assets.set(name, asset);
        }

        this._collections.set(collection.name, collection);

        return collection;
    }

    public async downloadAssets(urls: string[]): Promise<boolean> {
        if (!urls || !urls.length) return true;

        try {
            const results = await Promise.all(urls.map(url => this.downloadAsset(url)));

            return results.every(Boolean);
        } catch (err) {
            NitroLogger.error(err);

            return false;
        }
    }

    public async downloadAsset(url: string): Promise<boolean> {
        if (!url || !url.length) {
            NitroLogger.error(`Invalid url: ${url}`);

            return false;
        }

        const existing = this._downloadPromises.get(url);

        if (existing) return existing;

        const promise = this.downloadAssetInternal(url)
            .finally(() => this._downloadPromises.delete(url));

        this._downloadPromises.set(url, promise);

        return promise;
    }

    private async downloadAssetInternal(url: string): Promise<boolean> {
        try {
            const cleanUrl = url.split(/[?#]/, 1)[0];
            const ext = cleanUrl.slice(cleanUrl.lastIndexOf('.') + 1).toLowerCase();
            const response = await this.fetchWithRetry(url);

            if (!response) return false;

            const responseData = await response.arrayBuffer();

            switch (ext) {
                case 'nitro': {
                    const zip = await JSZip.loadAsync(responseData);
                    const bundle = await NitroBundle.fromZip(zip);

                    await this.processNitroBundle(bundle);
                    break;
                }
                case 'gif': {
                    const animatedGif = AnimatedGIF.fromBuffer(responseData);
                    const texture = animatedGif.texture;

                    this.setTexture(url, texture);
                    break;
                }
                case 'png': {
                    const bytes = new Uint8Array(responseData);

                    let binary = '';

                    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);

                    const base64 = btoa(binary);
                    const texture = await Assets.load<Texture>(`data:image/png;base64,${base64}`);

                    this.setTexture(url, texture);
                    break;
                }
                default: {
                    throw new Error(`Invalid asset extension: ${ext}`);
                }
            }

            return true;
        } catch (err) {
            NitroLogger.error(err);

            return false;
        }
    }

    private async fetchWithRetry(url: string, maxAttempts: number = 3): Promise<Response | undefined> {
        let lastError: unknown;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(url);

                if (response.ok) return response;

                lastError = new Error(`Asset request failed (${response.status}): ${url}`);

                if (response.status < 500 && response.status !== 429) break;
            } catch (error) {
                lastError = error;
            }

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, attempt * 250));
            }
        }

        NitroLogger.error(lastError ?? new Error(`Asset request failed: ${url}`));

        return undefined;
    }

    public get collections(): Map<string, IGraphicAssetCollection> {
        return this._collections;
    }

    private async processNitroBundle(bundle: NitroBundle): Promise<void> {
        if (!bundle) return;

        let assetData: IAssetData & { name?: string } = { type: '' };
        let spritesheet: Spritesheet | undefined = undefined;

        for (const key in bundle.files) {
            const name = key.substring(0, key.lastIndexOf('.'))
            const value = bundle.files[key];

            try {
                if (name.endsWith('_spritesheet')) {
                    const assetData = value as SpritesheetData;

                    if (!assetData.meta?.image) continue;

                    const texture = bundle.textures[assetData.meta.image];

                    if (texture) {
                        spritesheet = new Spritesheet(bundle.textures[assetData.meta?.image], assetData);

                        await spritesheet.parse();

                        //if (spritesheet.textureSource) spritesheet.textureSource.label = bundle.name;

                        this.setTexture(name, texture);
                    }
                } else {
                    assetData = { ...assetData, ...value };
                }
            }
            catch (err) {
                NitroLogger.error(err);

                continue;
            }
        }

        // `type` describes the asset contents (hr, ch, furniture, ...), not the
        // identity of the downloaded library. Figure scale variants frequently
        // share a type, so using it as the collection key makes whichever request
        // finishes last replace the other. Converted bundles expose their stable
        // library identity as `name`; furniture bundles without a name keep type.
        if (assetData.name) assetData.type = assetData.name;

        this.createCollection(assetData, spritesheet);
    }
}
