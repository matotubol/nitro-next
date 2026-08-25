export enum NavigatorSearchFilterType {
    Anything = 0,
    RoomName = 1,
    Owner = 2,
    Tag = 3,
    Group = 4
}

/** Wire prefixes the server splits `filteringData` on - `owner:frank`, `tag:pixel`. */
export const NAVIGATOR_FILTER_PREFIX: Record<NavigatorSearchFilterType, string> = {
    [NavigatorSearchFilterType.Anything]: '',
    [NavigatorSearchFilterType.RoomName]: 'roomname:',
    [NavigatorSearchFilterType.Owner]: 'owner:',
    [NavigatorSearchFilterType.Tag]: 'tag:',
    [NavigatorSearchFilterType.Group]: 'group:'
};
