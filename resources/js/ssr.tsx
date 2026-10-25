import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { type RouteName, route } from 'ziggy-js';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => title ? `${title} - ${appName}` : appName,
        resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob<ResolvedComponent>('./pages/**/*.tsx')),
        setup: ({ App, props }) => {
            /* eslint-disable */
            (global as any).route = (name: RouteName, params?: any, absolute?: boolean) =>
                route(name, params, absolute, {
                    // @ts-expect-error
                    ...page.props.ziggy,
                    // @ts-expect-error
                    location: new URL(page.props.ziggy.location),
                });
            /* eslint-enable */

            return <App {...props} />;
        },
    }),
);
