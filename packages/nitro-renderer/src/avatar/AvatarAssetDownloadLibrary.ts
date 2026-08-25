import type { IAvatarAssetDownloadLibrary } from "@nitrodevco/nitro-api";
import { AvatarAssetDownloadStatus, NitroLogger } from "@nitrodevco/nitro-api";

import { GetAssetManager } from "#renderer/assets";

export class AvatarAssetDownloadLibrary implements IAvatarAssetDownloadLibrary {
    private _state: AvatarAssetDownloadStatus = AvatarAssetDownloadStatus.NotLoaded;
    private _libraryName: string;
    private _revision: number;
    private _assetUrl: string;
    private _onSettled: (library: IAvatarAssetDownloadLibrary) => void;
    private _downloadPromise: Promise<boolean> | undefined;

    constructor(libraryName: string, revision: number, assetUrl: string, onSettled: (library: IAvatarAssetDownloadLibrary) => void) {
        this._libraryName = libraryName;
        this._revision = revision;
        this._assetUrl = assetUrl;
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
                NitroLogger.error(`Avatar library did not register a collection: ${this._libraryName}`);

                return false;
            }

            this._state = AvatarAssetDownloadStatus.Loaded;

            return true;
        })()
            .catch(err => {
                NitroLogger.error(err);

                return false;
            })
            .finally(() => {
                this._downloadPromise = undefined;

                // A library that never resolves leaves every figure waiting on it stuck
                // on the placeholder image, so failures have to settle too. The manager
                // reads `isLoaded` to tell the two outcomes apart.
                if (this._state !== AvatarAssetDownloadStatus.Loaded) this._state = AvatarAssetDownloadStatus.Failed;

                this._onSettled(this);
            });

        this._downloadPromise = promise;

        return promise;
    }

    public get libraryName(): string {
        return this._libraryName;
    }

    public get isLoaded(): boolean {
        return (this._state === AvatarAssetDownloadStatus.Loaded);
    }

    public get isFailed(): boolean {
        return (this._state === AvatarAssetDownloadStatus.Failed);
    }
}
