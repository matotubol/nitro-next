import type { IGraphicAsset } from '@nitrodevco/nitro-api';

import { GetAssetManager } from '../../assets';
import { AssetAlias } from './AssetAlias';

export class AssetAliasCollection {
    private _aliases: Map<string, AssetAlias> = new Map();

    public dispose(): void {
        this._aliases = new Map();
    }

    public reset(): void {
        this.init();
    }

    public init(): void {
        for (const collection of GetAssetManager().collections.values()) {
            if (collection) this.addCollection(collection.name);
        }
    }

    /** Register aliases from one newly downloaded avatar/effect library. */
    public addCollection(name: string): void {
        const aliasData = GetAssetManager().getCollection(name)?.data?.aliases as unknown;

        if (!aliasData || (typeof aliasData !== 'object')) return;

        const aliases = Array.isArray(aliasData) ? aliasData : Object.values(aliasData);

        for (const alias of aliases) {
            if (!alias) continue;

            const assetAlias = new AssetAlias(alias);

            this._aliases.set(assetAlias.name, assetAlias);
        }
    }

    public hasAlias(name: string): boolean {
        return !!this._aliases.get(name);
    }

    public getAssetName(name: string): string {
        let assetName = name;
        let levels = 5;

        while (this.hasAlias(assetName) && (levels >= 0)) {
            const alias = this._aliases.get(assetName);

            if (!alias || !alias.link) break;

            assetName = alias.link;
            levels--;
        }

        return assetName;
    }

    public getAsset(name: string): IGraphicAsset | undefined {
        return GetAssetManager().getAsset(this.getAssetName(name));
    }
}
