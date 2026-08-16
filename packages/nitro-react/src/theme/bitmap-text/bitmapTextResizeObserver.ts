type ResizeCallback = () => void;

const callbacks = new WeakMap<Element, ResizeCallback>();
let sharedObserver: ResizeObserver | null = null;

const getObserver = () => {
    if (sharedObserver || typeof ResizeObserver === 'undefined') {
        return sharedObserver;
    }

    sharedObserver = new ResizeObserver(entries => {
        for (const entry of entries) callbacks.get(entry.target)?.();
    });

    return sharedObserver;
};

export const observeBitmapTextResize = (element: Element, callback: ResizeCallback) => {
    const observer = getObserver();

    if (!observer) return () => undefined;

    callbacks.set(element, callback);
    observer.observe(element);

    return () => {
        observer.unobserve(element);
        callbacks.delete(element);
    };
};
