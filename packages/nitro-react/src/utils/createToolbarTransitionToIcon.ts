export type ToolbarTransitionTarget = 'inventory' | 'me-menu';

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
    source: HTMLImageElement | null,
) => {
    if (typeof document === 'undefined' || !source) return;

    const target = document.querySelector(TARGET_SELECTORS[targetName]);
    const sourceUrl = source.currentSrc || source.src;

    if (!target || !sourceUrl) return;

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    if (!sourceRect.width || !sourceRect.height) return;

    const transitionImage = document.createElement('img');
    const deltaX = targetRect.left + 20 - sourceRect.left;
    const deltaY = targetRect.top - sourceRect.top;
    const distance = Math.hypot(deltaX, deltaY);
    const duration = Math.max(
        250,
        Math.min(500, 500 - Math.abs((1 / Math.max(distance, 1)) * 25_000)),
    );

    transitionImage.src = sourceUrl;
    transitionImage.alt = '';
    transitionImage.setAttribute('aria-hidden', 'true');
    Object.assign(transitionImage.style, {
        position: 'fixed',
        zIndex: '1100',
        top: `${sourceRect.top}px`,
        left: `${sourceRect.left}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`,
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
