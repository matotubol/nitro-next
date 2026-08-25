/**
 * Why `FurniModel.requestSelectedFurniPlacement` refuses to hand an inventory
 * item to the room mover. `None` is the only value that arms a placement - every
 * other value is a reason the client already knows the attempt would fail, so
 * the action can be greyed out instead of bouncing off the server.
 */
export enum FurniturePlacementError {
    None = 0,
    NoItem = 1,
    NotInRoom = 2,
    NoPermission = 3,
    RentedInRoom = 4,
    UnsupportedType = 5,
}
