import type { IActivePage } from '@nitrodevco/nitro-api';
import type { ComponentType } from 'react';

export type CatalogLayoutProps = {
    page: IActivePage;
};

export type CatalogLayoutComponent = ComponentType<CatalogLayoutProps>;

export type CatalogLayoutDefinition = {
    id: string;
    codes: readonly string[];
    component: CatalogLayoutComponent;
};
