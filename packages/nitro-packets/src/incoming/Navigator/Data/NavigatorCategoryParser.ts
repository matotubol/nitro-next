import type { IMessageDataWrapper } from '@nitrodevco/nitro-api';

/** A room category a room can be filed under - mirrors `navigator_flatcats`. */
export interface INavigatorFlatCategory {
    id: number;
    name: string;
    visible: boolean;
    automatic: boolean;
    automaticCategoryKey: string;
    globalCategoryKey: string;
    staffOnly: boolean;
}

/** An event category - mirrors `navigator_eventcats`. */
export interface INavigatorEventCategory {
    id: number;
    name: string;
    visible: boolean;
}

export const NavigatorFlatCategoryParser = (wrapper: IMessageDataWrapper): INavigatorFlatCategory => ({
    id: wrapper.readInt(),
    name: wrapper.readString(),
    visible: wrapper.readBoolean(),
    automatic: wrapper.readBoolean(),
    automaticCategoryKey: wrapper.readString(),
    globalCategoryKey: wrapper.readString(),
    staffOnly: wrapper.readBoolean()
});

export const NavigatorEventCategoryParser = (wrapper: IMessageDataWrapper): INavigatorEventCategory => ({
    id: wrapper.readInt(),
    name: wrapper.readString(),
    visible: wrapper.readBoolean()
});

/**
 * `${navigator.flatcategory.global.<key>}` wins over the raw name whenever the
 * category carries a global key, matching `NavigatorCategoryData.visibleName`.
 */
export const GetFlatCategoryLocalizationKey = (category: INavigatorFlatCategory) =>
    category.globalCategoryKey.length ? `navigator.flatcategory.global.${category.globalCategoryKey}` : '';
