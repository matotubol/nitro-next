import type { IAvatarEffectListener, IEffectAssetDownloadLibrary, IEffectMapLibrary } from '@nitrodevco/nitro-api';

import type { AvatarStructure } from './AvatarStructure';
import { EffectAssetDownloadLibrary } from './EffectAssetDownloadLibrary';

type PendingEffectLibraryDownload = {
    library: EffectAssetDownloadLibrary;
    resolve: () => void;
};

export class EffectAssetDownloadManager {
    private static MANDATORY_LIBRARIES: string[] = ['dance.1', 'dance.2', 'dance.3', 'dance.4'];
    private static MAX_CONCURRENT_DOWNLOADS: number = 4;

    private _structure: AvatarStructure;
    private _missingMandatoryLibs: string[] = EffectAssetDownloadManager.MANDATORY_LIBRARIES;
    private _effectMap: Map<string, EffectAssetDownloadLibrary[]> = new Map();
    private _pendingDownloads: [number, IAvatarEffectListener][] = [];
    private _effectListeners: Map<number, IAvatarEffectListener[]> = new Map();
    private _incompleteEffects: Map<number, EffectAssetDownloadLibrary[]> = new Map();
    private _librariesByName: Map<string, EffectAssetDownloadLibrary> = new Map();
    private _pendingDownloadQueue: PendingEffectLibraryDownload[] = [];
    private _currentDownloads: Set<EffectAssetDownloadLibrary> = new Set();
    private _downloadPromises: Map<EffectAssetDownloadLibrary, Promise<void>> = new Map();
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

    public processEffectMap(data: IEffectMapLibrary[], assetUrl: string): void {
        if (!data) return;

        for (const library of data) {
            if (!library) continue;

            let downloadLibrary = this._librariesByName.get(library.lib);

            if (!downloadLibrary) {
                downloadLibrary = new EffectAssetDownloadLibrary(library.lib, library.revision ?? 0, assetUrl, lib => this.onLibraryLoaded(lib));
                this._librariesByName.set(library.lib, downloadLibrary);

                if (downloadLibrary.isLoaded) this._onAssetLibraryLoaded?.(downloadLibrary.libraryName);
            }

            let existing = this._effectMap.get(library.id);

            if (!existing) {
                existing = [];

                this._effectMap.set(library.id, existing);
            }

            if (!existing.includes(downloadLibrary)) existing.push(downloadLibrary);
        }
    }

    public processMissingLibraries(): void {
        for (const lib of this._missingMandatoryLibs.slice()) {
            const libraries = this._effectMap.get(lib);

            if (libraries) for (const effect of libraries) this.downloadLibrary(effect);
        }
    }

    public processPendingDownloads(): void {
        for (const [id, listener] of this._pendingDownloads) this.downloadAvatarEffect(id, listener);

        this._pendingDownloads = [];
    }

    public isAvatarEffectReady(effect: number): boolean {
        return this._isReady && !this.getAvatarEffectPendingLibraries(effect).length;
    }

    public downloadAvatarEffect(id: number, listener: IAvatarEffectListener): void {
        if (!this._isReady) {
            this._pendingDownloads.push([id, listener]);

            return;
        }

        const libraries = this.getAvatarEffectPendingLibraries(id);

        if (libraries.length) {
            let listeners = this._effectListeners.get(id);

            if (!listeners) {
                listeners = [];

                this._effectListeners.set(id, listeners);
            }

            if (!listeners.includes(listener)) listeners.push(listener);

            this._incompleteEffects.set(id, libraries);

            for (const library of libraries) this.downloadLibrary(library);
        }
        else listener.resetEffect(id);
    }

    public async downloadAvatarEffectAsync(id: number): Promise<void> {
        await this._readyPromise;

        const libraries = this.getAvatarEffectPendingLibraries(id);

        if (!libraries.length) return;

        await Promise.all(libraries.map(library => this.downloadLibraryAsync(library)));

        const failed = libraries.filter(library => !library.isLoaded);

        if (failed.length) throw new Error(`Failed to load effect libraries: ${failed.map(library => library.libraryName).join(', ')}`);
    }

    public setReady(): void {
        if (this._isReady) return;

        this._isReady = true;
        this._resolveReady();
    }

    private getAvatarEffectPendingLibraries(id: number): EffectAssetDownloadLibrary[] {
        const pendingLibraries: EffectAssetDownloadLibrary[] = [];

        if (!this._structure) return pendingLibraries;

        const libraries = this._effectMap.get(id.toString());

        if (libraries) {
            for (const library of libraries) {
                if (!library || library.isLoaded) continue;

                if (pendingLibraries.indexOf(library) === -1) pendingLibraries.push(library);
            }
        }

        return pendingLibraries;
    }

    private downloadLibrary(library: EffectAssetDownloadLibrary): void {
        void this.getOrCreateQueuedDownload(library);
    }

    private async downloadLibraryAsync(library: EffectAssetDownloadLibrary): Promise<void> {
        await this.getOrCreateQueuedDownload(library);
    }

    private processDownloadQueue(): void {
        while (this._pendingDownloadQueue.length && this._currentDownloads.size < EffectAssetDownloadManager.MAX_CONCURRENT_DOWNLOADS) {
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

    private getOrCreateQueuedDownload(library: EffectAssetDownloadLibrary): Promise<void> {
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

    private onLibraryLoaded(library: IEffectAssetDownloadLibrary): void {
        if (!library) return;

        const loadedEffects: number[] = [];

        this._onAssetLibraryLoaded?.(library.libraryName);
        this._structure.registerAnimations(library.animations);

        for (const [id, libraries] of this._incompleteEffects.entries()) {
            let isReady = true;

            for (const library of libraries) {
                if (!library || library.isLoaded) continue;

                isReady = false;

                break;
            }

            if (!isReady) continue;

            loadedEffects.push(id);

            const listeners = this._effectListeners.get(id);

            if (listeners) {
                for (const listener of listeners) listener.resetEffect(id);
            }

            this._effectListeners.delete(id);
        }

        for (const id of loadedEffects) this._incompleteEffects.delete(id);

    }

    public get isReady(): boolean {
        return this._isReady;
    }
}
