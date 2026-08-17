import type { IAvatarAssetDownloadLibrary, IAvatarFigureContainer, IAvatarImageListener, IFigureMapLibrary } from '@nitrodevco/nitro-api';

import { AvatarAssetDownloadLibrary } from './AvatarAssetDownloadLibrary';
import type { AvatarStructure } from './AvatarStructure';

type PendingAvatarLibraryDownload = {
    library: AvatarAssetDownloadLibrary;
    resolve: () => void;
};

export class AvatarAssetDownloadManager {
    private static MANDATORY_LIBRARIES: string[] = ['hh_human_body', 'hh_human_item'];
    private static MAX_CONCURRENT_DOWNLOADS: number = 6;

    private _structure: AvatarStructure;
    private _figureMap: Map<string, AvatarAssetDownloadLibrary[]> = new Map();
    private _librariesByName: Map<string, AvatarAssetDownloadLibrary> = new Map();
    private _pendingContainers: [IAvatarFigureContainer, IAvatarImageListener][] = [];
    private _figureListeners: Map<string, IAvatarImageListener[]> = new Map();
    private _incompleteFigures: Map<string, AvatarAssetDownloadLibrary[]> = new Map();
    private _pendingDownloadQueue: PendingAvatarLibraryDownload[] = [];
    private _currentDownloads: Set<AvatarAssetDownloadLibrary> = new Set();
    private _downloadPromises: Map<AvatarAssetDownloadLibrary, Promise<void>> = new Map();
    private _isReady: boolean = false;
    private _readyPromise: Promise<void>;
    private _resolveReady!: () => void;
    private _onAssetLibraryLoaded: ((libraryName: string) => void) | undefined;

    constructor(structure: AvatarStructure, onAssetLibraryLoaded?: (libraryName: string) => void) {
        this._structure = structure;
        this._onAssetLibraryLoaded = onAssetLibraryLoaded;
        this._readyPromise = new Promise(resolve => {
            this._resolveReady = resolve;
        });
    }

    public processFigureMap(data: IFigureMapLibrary[], assetUrl: string): void {
        if (!data) return;

        for (const library of data) {
            if (!library) continue;

            let downloadLibrary = this._librariesByName.get(library.id);

            if (!downloadLibrary) {
                downloadLibrary = new AvatarAssetDownloadLibrary(library.id, library.revision ?? 0, assetUrl, lib => this.onLibraryLoaded(lib));
                this._librariesByName.set(library.id, downloadLibrary);

                if (downloadLibrary.isLoaded) this._onAssetLibraryLoaded?.(downloadLibrary.libraryName);
            }

            if (!library.parts?.length) continue;

            for (const part of library.parts) {
                const partString = `${part.type}:${part.id}`;

                let existing = this._figureMap.get(partString);

                if (!existing) {
                    existing = [];

                    this._figureMap.set(partString, existing);
                }

                if (!existing.includes(downloadLibrary)) existing.push(downloadLibrary);
            }
        }
    }

    public processMissingLibraries(): void {
        for (const name of AvatarAssetDownloadManager.MANDATORY_LIBRARIES) {
            const library = this._librariesByName.get(name);

            if (library) this.downloadLibrary(library);
        }
    }

    public processPendingContainers(): void {
        for (const [container, listener] of this._pendingContainers) this.downloadAvatarFigure(container, listener);

        this._pendingContainers = [];
    }

    public isAvatarFigureContainerReady(container: IAvatarFigureContainer): boolean {
        return this._isReady && !this.getAvatarFigurePendingLibraries(container).length;
    }

    public downloadAvatarFigure(container: IAvatarFigureContainer, listener: IAvatarImageListener): void {
        if (!this._isReady) {
            this._pendingContainers.push([container, listener]);

            return;
        }

        const figure = container.getFigureString();
        const libraries = this.getAvatarFigurePendingLibraries(container);

        if (libraries.length) {
            let listeners = this._figureListeners.get(figure);

            if (!listeners) {
                listeners = [];

                this._figureListeners.set(figure, listeners);
            }

            if (!listeners.includes(listener)) listeners.push(listener);

            this._incompleteFigures.set(figure, libraries);

            for (const library of libraries) this.downloadLibrary(library);
        }
        else listener.resetFigure(figure);
    }

    public async downloadAvatarFigureAsync(container: IAvatarFigureContainer): Promise<void> {
        await this._readyPromise;

        const libraries = this.getAvatarFigurePendingLibraries(container);

        if (!libraries.length) return;

        await Promise.all(libraries.map(library => this.downloadLibraryAsync(library)));

        const failed = libraries.filter(library => !library.isLoaded);

        if (failed.length) throw new Error(`Failed to load avatar libraries: ${failed.map(library => library.libraryName).join(', ')}`);
    }

    public setReady(): void {
        if (this._isReady) return;

        this._isReady = true;
        this._resolveReady();
    }

    private getAvatarFigurePendingLibraries(container: IAvatarFigureContainer): AvatarAssetDownloadLibrary[] {
        const pendingLibraries: AvatarAssetDownloadLibrary[] = [];

        if (!container || !this._structure) return pendingLibraries;

        const figureData = this._structure.figureData;

        if (!figureData) return pendingLibraries;

        const partTypes = container.getPartTypeIds();

        for (const partType of partTypes) {
            const set = figureData.getSetType(partType);

            if (!set) continue;

            const figurePartSet = set.getPartSet(container.getPartSetId(partType));

            if (!figurePartSet) continue;

            for (const library of this.getFigurePartSetLibraries(figurePartSet.parts.map(part => `${part.type}:${part.id}`))) {
                if (!library.isLoaded && !pendingLibraries.includes(library)) pendingLibraries.push(library);
            }
        }

        return pendingLibraries;
    }

    /**
     * Figure-map entries list every part required by a library's figure set, not
     * only the sprites physically stored in that bundle. Custom faces therefore
     * claim generic parts such as bd:1 and hd:1 while containing only their unique
     * overlay. Prefer the canonical core owner for core parts, and only fan out
     * to custom libraries for non-core part ids.
     */
    private getFigurePartSetLibraries(partKeys: string[]): AvatarAssetDownloadLibrary[] {
        const selected: AvatarAssetDownloadLibrary[] = [];

        for (const partKey of new Set(partKeys)) {
            const mapped = this._figureMap.get(partKey) ?? [];
            const fullSize = mapped.filter(library => !library.libraryName.includes('_50_'));
            const canonical = fullSize.filter(library => library.libraryName.startsWith('hh_human_'));
            const libraries = canonical.length ? canonical : (fullSize.length ? fullSize : mapped);

            for (const library of libraries) {
                if (!selected.includes(library)) selected.push(library);
            }
        }

        return selected;
    }

    private downloadLibrary(library: AvatarAssetDownloadLibrary): void {
        void this.getOrCreateQueuedDownload(library);
    }

    private async downloadLibraryAsync(library: AvatarAssetDownloadLibrary): Promise<void> {
        await this.getOrCreateQueuedDownload(library);
    }

    private processDownloadQueue(): void {
        while (this._pendingDownloadQueue.length && this._currentDownloads.size < AvatarAssetDownloadManager.MAX_CONCURRENT_DOWNLOADS) {
            const pending = this._pendingDownloadQueue.shift();

            if (!pending) continue;

            const { library, resolve } = pending;

            this._currentDownloads.add(library);

            void library.downloadAssetAsync()
                .finally(() => {
                    this._currentDownloads.delete(library);
                    this._downloadPromises.delete(library);
                    resolve();
                    this.processDownloadQueue();
                });
        }
    }

    private getOrCreateQueuedDownload(library: AvatarAssetDownloadLibrary): Promise<void> {
        if (!library || library.isLoaded) return Promise.resolve();

        const existing = this._downloadPromises.get(library);

        if (existing) return existing;

        let resolveDownload!: () => void;
        const promise = new Promise<void>(resolve => {
            resolveDownload = resolve;
        });

        this._downloadPromises.set(library, promise);
        this._pendingDownloadQueue.push({ library, resolve: resolveDownload });
        this.processDownloadQueue();

        return promise;
    }

    private onLibraryLoaded(library: IAvatarAssetDownloadLibrary): void {
        if (!library) return;

        const loadedFigures: string[] = [];

        // The SWF registers a library's aliases before it wakes figure listeners.
        // Without this, the library remains marked as loaded but aliased clothing
        // frames cannot be resolved when that figure is created again.
        this._onAssetLibraryLoaded?.(library.libraryName);

        for (const [figure, libraries] of this._incompleteFigures.entries()) {
            let isReady = true;

            for (const library of libraries) {
                if (!library || library.isLoaded) continue;

                isReady = false;

                break;
            }

            if (!isReady) continue;

            loadedFigures.push(figure);

            const listeners = this._figureListeners.get(figure);

            if (listeners) {
                for (const listener of listeners) listener.resetFigure(figure);
            }

            this._figureListeners.delete(figure);
        }

        for (const figure of loadedFigures) this._incompleteFigures.delete(figure);

    }

    public get isReady(): boolean {
        return this._isReady;
    }
}
