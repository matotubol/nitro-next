import type { IMessageDataWrapper, INavigatorQuickLink } from '@nitrodevco/nitro-api';

export const NavigatorQuickLinkParser = (wrapper: IMessageDataWrapper): INavigatorQuickLink => ({
    id: wrapper.readInt(),
    searchCode: wrapper.readString(),
    filter: wrapper.readString(),
    localization: wrapper.readString()
});

export const NavigatorQuickLinkListParser = (wrapper: IMessageDataWrapper): INavigatorQuickLink[] => {
    const links: INavigatorQuickLink[] = [];

    let count = wrapper.readInt();

    while (count > 0) {
        links.push(NavigatorQuickLinkParser(wrapper));

        count--;
    }

    return links;
}
