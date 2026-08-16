import type { Container, RenderTexture } from 'pixi.js';
import { Point } from 'pixi.js';

import { TexturePool } from '#renderer/utils';

export class AvatarImageBodyPartContainer {
    private _image: Container;
    private _regPoint: Point;
    private _offset: Point;
    private _isCacheable: boolean;
    private _ownedTexture: RenderTexture | undefined;

    constructor(k: Container, _arg_2: Point, _arg_3: boolean, ownedTexture: RenderTexture | undefined = undefined) {
        this._image = k;
        this._regPoint = _arg_2;
        this._offset = new Point(0, 0);
        this._regPoint = _arg_2;
        this._isCacheable = _arg_3;
        this._ownedTexture = ownedTexture;

        this.cleanPoints();
    }

    public dispose(): void {
        if (this._image) {
            this._image.destroy({
                children: true
            });
        }

        this.releaseOwnedTexture();
    }

    private cleanPoints(): void {
        // this._regPoint.x    = this._regPoint.x;
        // this._regPoint.y    = this._regPoint.y;
        // this._offset.x      = this._offset.x;
        // this._offset.y      = this._offset.y;
    }

    private releaseOwnedTexture(): void {
        if (!this._ownedTexture) return;

        TexturePool.releaseTexture(this._ownedTexture);
        this._ownedTexture = undefined;
    }

    public setRegPoint(k: Point): void {
        this._regPoint = k;

        this.cleanPoints();
    }

    public get image(): Container {
        return this._image;
    }

    public set image(k: Container) {
        if (this._image && (this._image !== k)) {
            this._image.destroy({
                children: true
            });

            this.releaseOwnedTexture();
        }

        this._image = k;
    }

    public get regPoint(): Point {
        const clone = this._regPoint.clone();

        clone.x += this._offset.x;
        clone.y += this._offset.y;

        return clone;
    }

    public set offset(k: Point) {
        this._offset = k;

        this.cleanPoints();
    }

    public get isCacheable(): boolean {
        return this._isCacheable;
    }
}
