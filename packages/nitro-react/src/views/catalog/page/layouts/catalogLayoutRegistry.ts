import type { IActivePage } from '@nitrodevco/nitro-api';

import { CatalogLayoutDefaultView } from './CatalogLayoutDefaultView';
import type {
    CatalogLayoutComponent,
    CatalogLayoutDefinition,
} from './catalogLayoutTypes';

const catalogLayoutDefinitions = [
    {
        id: 'default-product-grid',
        codes: ['default_3x3', 'default_3x3_color_grouping'],
        component: CatalogLayoutDefaultView,
    },
] as const satisfies readonly CatalogLayoutDefinition[];

const catalogLayoutEntries = catalogLayoutDefinitions.flatMap(definition => {
    return definition.codes.map(code => [code, definition.component] as const);
});

const catalogLayoutRegistry = new Map<string, CatalogLayoutComponent>(catalogLayoutEntries);

export const resolveCatalogLayout = (
    page: IActivePage,
): CatalogLayoutComponent | null => {
    const registeredLayout = catalogLayoutRegistry.get(page.layoutCode);

    if (registeredLayout) return registeredLayout;

    return page.offers.length ? CatalogLayoutDefaultView : null;
};
