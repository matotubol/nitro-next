import type { IAvatarAssetDownloadLibrary } from "@nitrodevco/nitro-api";
import { AvatarAssetDownloadStatus, NitroLogger } from "@nitrodevco/nitro-api";

import { GetAssetManager } from "#renderer/assets";

export class AvatarAssetDownloadLibrary implements IAvatarAssetDownloadLibrary {
    private _state: AvatarAssetDownloadStatus = AvatarAssetDownloadStatus.NotLoaded;
    private _libraryName: string;
    private _revision: number;
    private _assetUrl: string;
    private _onDownloaded: (library: IAvatarAssetDownloadLibrary) => void;
    private _downloadPromise: Promise<boolean> | undefined;

    constructor(libraryName: string, revision: number, assetUrl: string, onDownloaded: (library: IAvatarAssetDownloadLibrary) => void) {
        this._libraryName = libraryName;
        this._revision = revision;
        this._assetUrl = assetUrl;
        this._onDownloaded = onDownloaded;

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
            const asset = GetAssetManager().getCollection(this._libraryName);

            if (!asset && !(await GetAssetManager().downloadAsset(this._assetUrl))) {
                this._state = AvatarAssetDownloadStatus.NotLoaded;

                return false;
            }

            this._state = AvatarAssetDownloadStatus.Loaded;
            this._onDownloaded(this);

            return true;
        })()
            .catch(err => {
                this._state = AvatarAssetDownloadStatus.NotLoaded;
                NitroLogger.error(err);

                return false;
            })
            .finally(() => {
                this._downloadPromise = undefined;
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
}
