import 'dotenv/config';
import '@pixi/node';

import { serve } from '@hono/node-server';
import { NitroLogger } from '@nitrodevco/nitro-api';
import { PrepareRenderer, TexturePool } from '@nitrodevco/nitro-renderer';

import { GetHono } from './GetHono';
import { AvatarLoader } from './loaders/AvatarLoader';

NitroLogger.LOG_DEBUG = true;
NitroLogger.LOG_ERROR = true;

const init = async () => {
    try {
        NitroLogger.log(`Preparing Imager`);
        await PrepareRenderer({});
        TexturePool.startAutoCleanup();
        await AvatarLoader();

        serve({
            fetch: GetHono().fetch,
            port: Number(process.env.WEB_PORT) || 3000,
        }, () => {
            console.log(`listening!`)
        });
    } catch (err) {
        NitroLogger.error(err);
    }
}

void init();
