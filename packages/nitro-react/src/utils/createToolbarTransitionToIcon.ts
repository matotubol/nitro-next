export type ToolbarTransitionTarget = 'inventory' | 'me-menu';

/**
 * Either a DOM image already on screen - the catalog's product thumbnail - or a
 * bare screen point, for callers whose source is drawn on the room canvas and so
 * has no element to measure. `animateToIcon` builds its transition window at
 * `Rectangle(x, y, bitmap.width, bitmap.height)`, so a point source keeps the
 * icon at its natural size rather than stretching it to fill anything.
 */
export type ToolbarTransitionPoint = { url: string; x: number; y: number };

export type ToolbarTransitionSource = HTMLImageElement | ToolbarTransitionPoint;

type ResolvedSource = {
    url: string;
    top: number;
    left: number;
    width?: number;
    height?: number;
};

const resolveSource = (source: ToolbarTransitionSource | null | undefined): ResolvedSource | undefined => {
    if (!source) return undefined;

    if (source instanceof HTMLImageElement) {
        const url = source.currentSrc || source.src;
        const rect = source.getBoundingClientRect();

        if (!url || !rect.width || !rect.height) return undefined;

        return { url, top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    }

    if (!source.url) return undefined;

    return { url: source.url, top: source.y, left: source.x };
};

const TARGET_SELECTORS: Record<ToolbarTransitionTarget, string> = {
    inventory: '[data-toolbar-transition-target="inventory"]',
    'me-menu': '[data-toolbar-transition-target="me-menu"]',
};

const activeTargetAnimations = new WeakMap<Element, Animation>();

const bounceToolbarTarget = (target: Element) => {
    const activeAnimation = activeTargetAnimations.get(target);

    if (activeAnimation && activeAnimation.playState !== 'finished') return;

    const animation = target.animate(
        [
            { translate: '0 0' },
            { translate: '0 12px', offset: 0.35 },
            { translate: '0 -5px', offset: 0.62 },
            { translate: '0 2px', offset: 0.82 },
            { translate: '0 0' },
        ],
        { duration: 400, easing: 'ease-out' },
    );

    activeTargetAnimations.set(target, animation);
    animation.addEventListener(
        'finish',
        () => activeTargetAnimations.delete(target),
        { once: true },
    );
};

export const createToolbarTransitionToIcon = (
    targetName: ToolbarTransitionTarget,
    source: ToolbarTransitionSource | null | undefined,
) => {
    if (typeof document === 'undefined') return;

    const resolved = resolveSource(source);
    const target = document.querySelector(TARGET_SELECTORS[targetName]);

    if (!target || !resolved) return;

    const targetRect = target.getBoundingClientRect();

    const transitionImage = document.createElement('img');
    // `animateToIcon`: the landing point is nudged 20px into the icon
    const deltaX = targetRect.left + 20 - resolved.left;
    const deltaY = targetRect.top - resolved.top;
    const distance = Math.hypot(deltaX, deltaY);
    const duration = Math.max(
        250,
        Math.min(500, 500 - Math.abs((1 / Math.max(distance, 1)) * 25_000)),
    );

    transitionImage.src = resolved.url;
    transitionImage.alt = '';
    transitionImage.setAttribute('aria-hidden', 'true');
    Object.assign(transitionImage.style, {
        position: 'fixed',
        zIndex: '1100',
        top: `${resolved.top}px`,
        left: `${resolved.left}px`,
        ...(resolved.width !== undefined && { width: `${resolved.width}px` }),
        ...(resolved.height !== undefined && { height: `${resolved.height}px` }),
        pointerEvents: 'none',
        imageRendering: 'pixelated',
        filter: [
            'drop-shadow(-1px -1px 0 #ffffff)',
            'drop-shadow(0 -1px 0 #ffffff)',
            'drop-shadow(1px -1px 0 #ffffff)',
            'drop-shadow(-1px 0 0 #ffffff)',
            'drop-shadow(1px 0 0 #ffffff)',
            'drop-shadow(-1px 1px 0 #ffffff)',
            'drop-shadow(0 1px 0 #ffffff)',
            'drop-shadow(1px 1px 0 #ffffff)',
        ].join(' '),
        transformOrigin: 'top left',
    });

    document.body.appendChild(transitionImage);

    const transition = transitionImage.animate(
        [
            { transform: 'translate(0, 0)', offset: 0 },
            {
                transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.5 - 100}px)`,
                offset: 0.5,
            },
            { transform: `translate(${deltaX}px, ${deltaY}px)`, offset: 1 },
        ],
        { duration, easing: 'ease-out', fill: 'forwards' },
    );

    transition.addEventListener(
        'finish',
        () => {
            transitionImage.remove();
            bounceToolbarTarget(target);
        },
        { once: true },
    );
};
