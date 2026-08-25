import type { INavigatorQuickLink } from './INavigatorQuickLink';

/** One tab across the top of the navigator, plus the shortcuts it opens with. */
export interface INavigatorTopLevelContext {
    searchCode: string;
    quickLinks: INavigatorQuickLink[];
}
