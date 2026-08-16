import { createElement } from 'react';

import { useCatalogSelectors } from '#base/context';

import { resolveCatalogLayout } from './layouts/catalogLayoutRegistry';

export const CatalogActivePage = () => {
    const { activePage } = useCatalogSelectors();

    if (!activePage) return null;

    const CatalogLayout = resolveCatalogLayout(activePage);

    if (!CatalogLayout) return null;

    return createElement(CatalogLayout, { page: activePage });
};
