/** A saved search, or one of the shortcuts a top level context ships with. */
export interface INavigatorQuickLink {
    id: number;
    searchCode: string;
    filter: string;
    localization: string;
}
