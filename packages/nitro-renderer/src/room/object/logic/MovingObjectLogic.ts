import type { IRoomObjectController, IRoomObjectUpdateMessage, IVector3D } from '@nitrodevco/nitro-api';
import { RoomObjectMoveEvent, RoomObjectVariableEnum, Vector3d } from '@nitrodevco/nitro-api';

import { ObjectMoveUpdateMessage } from '../../messages';
import { RoomObjectLogicBase } from './RoomObjectLogicBase';

export class MovingObjectLogic extends RoomObjectLogicBase {
    public static DEFAULT_UPDATE_INTERVAL: number = 500;
    private static TEMP_VECTOR: Vector3d = new Vector3d();

    private _liftAmount: number = 0;
    private _location: Vector3d = new Vector3d();
    private _locationDelta: Vector3d = new Vector3d();
    private _lastUpdateTime: number = 0;
    private _changeTime: number = 0;
    private _updateInterval: number = MovingObjectLogic.DEFAULT_UPDATE_INTERVAL;

    public override getEventTypes(): string[] {
        return this.mergeTypes(super.getEventTypes(), [
            RoomObjectMoveEvent.SLIDE_ANIMATION,
        ]);
    }

    public override dispose(): void {
        this._liftAmount = 0;

        super.dispose();
    }

    public override update(time: number): void {
        super.update(time);

        const locationOffset = this.getLocationOffset();

        if (locationOffset) {
            if (this._liftAmount !== locationOffset.z) {
                this._liftAmount = locationOffset.z;

                this.object.model.setValue(RoomObjectVariableEnum.FurnitureLiftAmount, this._liftAmount);
            }
        } else if (this._liftAmount !== 0) {
            this._liftAmount = 0;

            this.object.model.setValue(RoomObjectVariableEnum.FurnitureLiftAmount, this._liftAmount);
        }

        if (this._locationDelta.length > 0 || locationOffset) {
            const vector = MovingObjectLogic.TEMP_VECTOR;

            let difference = this.time - this._changeTime;

            if (difference === this._updateInterval >> 1) difference++;

            if (difference > this._updateInterval) difference = this._updateInterval;

            if (this._locationDelta.length > 0) {
                vector.assign(this._locationDelta);
                vector.multiply(difference / this._updateInterval);
                vector.add(this._location);
            } else {
                vector.assign(this._location);
            }

            if (locationOffset) vector.add(locationOffset);

            this.object.setLocation(vector);

            if (difference === this._updateInterval) {
                // Commit the finished slide into _location: later offset-only renders (e.g. the
                // rotate bounce) draw from it, and an uncommitted slide made them flash the object
                // back to the tile the slide started from.
                this._location.add(this._locationDelta);

                this._locationDelta.x = 0;
                this._locationDelta.y = 0;
                this._locationDelta.z = 0;
            }

            this.eventHandler.eventDispatcher.dispatchEvent(new RoomObjectMoveEvent(RoomObjectMoveEvent.SLIDE_ANIMATION, this.object));
        }

        this._lastUpdateTime = this.time;
    }

    public override processUpdateMessage(message: IRoomObjectUpdateMessage): void {
        if (!message) return;

        super.processUpdateMessage(message);

        if (message.location) {
            this._location.assign(message.location);

            // An absolute position cancels an in-flight slide: interpolating the leftover delta
            // from the new base slides the object one extra tile past where the server put it.
            if (!(message instanceof ObjectMoveUpdateMessage)) {
                this._locationDelta.x = 0;
                this._locationDelta.y = 0;
                this._locationDelta.z = 0;
            }
        }

        if (message instanceof ObjectMoveUpdateMessage) {
            if (message.skipPositionUpdate) return;

            if (message.location) {
                this._location.assign(message.location);

                this._locationDelta.x = 0;
                this._locationDelta.y = 0;
                this._locationDelta.z = 0;

                if (message.targetLocation) {
                    this._updateInterval = Math.max(1, isNaN(message.animationTime) ? MovingObjectLogic.DEFAULT_UPDATE_INTERVAL : message.animationTime);
                    this._changeTime = this._lastUpdateTime;
                    this._locationDelta.assign(message.targetLocation);
                    this._locationDelta.subtract(this._location);
                }
            }

            return;
        }
    }

    public override setObject(object: IRoomObjectController): void {
        super.setObject(object);

        if (object) this._location.assign(object.getLocation());
    }

    protected getLocationOffset(): IVector3D | undefined {
        return undefined;
    }

    protected get lastUpdateTime(): number {
        return this._lastUpdateTime;
    }

    protected set updateInterval(interval: number) {
        if (interval <= 0) interval = 1;

        this._updateInterval = interval;
    }
}
