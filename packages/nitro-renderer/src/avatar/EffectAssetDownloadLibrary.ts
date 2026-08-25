import type { IAssetAnimation, IEffectAssetDownloadLibrary } from "@nitrodevco/nitro-api";
import { AvatarAssetDownloadStatus, NitroLogger } from "@nitrodevco/nitro-api";

import { GetAssetManager } from "#renderer/assets";

export class EffectAssetDownloadLibrary implements IEffectAssetDownloadLibrary {
    private _state: AvatarAssetDownloadStatus = AvatarAssetDownloadStatus.NotLoaded;
    private _libraryName: string;
    private _revision: number;
    private _assetUrl: string;
    private _animations: IAssetAnimation[];
    private _onSettled: (library: IEffectAssetDownloadLibrary) => void;
    private _downloadPromise: Promise<boolean> | undefined;

    constructor(libraryName: string, revision: number, assetUrl: string, onSettled: (library: IEffectAssetDownloadLibrary) => void) {
        this._libraryName = libraryName;
        this._revision = revision;
        this._assetUrl = assetUrl;
        this._animations = [];
        this._onSettled = onSettled;

        this._assetUrl = this._assetUrl.replace(/%libname%/gi, this._libraryName);
        this._assetUrl = this._assetUrl.replace(/%revision%/gi, this._revision.toString());

        if (GetAssetManager().getCollection(this._libraryName)) this._state = AvatarAssetDownloadStatus.Loaded;
    }

    public downloadAsset(): void {
        void this.getOrCreateDownload();
    }

    public async downloadAssetAsync(): Promise<void> {
        await this.getOrCreateDownload();
    }

    private getOrCreateDownload(): Promise<boolean> {
        if (this._state === AvatarAssetDownloadStatus.Loaded) return Promise.resolve(true);

        if (this._downloadPromise) return this._downloadPromise;

        this._state = AvatarAssetDownloadStatus.Loading;

        const promise = (async () => {
            let asset = GetAssetManager().getCollection(this._libraryName);

            if (!asset && !(await GetAssetManager().downloadAsset(this._assetUrl))) return false;

            asset = GetAssetManager().getCollection(this._libraryName);

            if (!asset) {
                NitroLogger.error(`Effect library did not register a collection: ${this._libraryName}`);

                return false;
            }

            this._state = AvatarAssetDownloadStatus.Loaded;
            this._animations = asset.data?.animations ?? [];

            return true;
        })()
            .catch(err => {
                NitroLogger.error(err);

                return false;
            })
            .finally(() => {
                this._downloadPromise = undefined;

                // Settle on failure as well, otherwise every avatar waiting on this
                // effect keeps its listener registered forever. See the matching
                // comment in AvatarAssetDownloadLibrary.
                if (this._state !== AvatarAssetDownloadStatus.Loaded) this._state = AvatarAssetDownloadStatus.Failed;

                this._onSettled(this);
            });

        this._downloadPromise = promise;

        return promise;
    }

    public get libraryName(): string {
        return this._libraryName;
    }

    public get animations(): IAssetAnimation[] {
        return this._animations;
    }

    public get isLoaded(): boolean {
        return (this._state === AvatarAssetDownloadStatus.Loaded);
    }

    public get isFailed(): boolean {
        return (this._state === AvatarAssetDownloadStatus.Failed);
    }
}
