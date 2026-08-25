/** Where a locked-room entry attempt currently sits. */
export enum NavigatorDoorState {
    None = 0,
    Start = 1,
    Waiting = 2,
    NoAnswer = 3,
    Accepted = 4,
    Password = 5,
    Failed = 6,
    Unavailable = 7
}
