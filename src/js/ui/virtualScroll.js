// Virtual scrolling for efficient rendering of long lists
export class VirtualScroller {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        this.options = {
            itemHeight: options.itemHeight || 80,
            bufferSize: options.bufferSize || 5,
            renderItem: options.renderItem || ((item) => `<div>${item}</div>`),
            onLoadMore: options.onLoadMore || null,
            loadMoreThreshold: options.loadMoreThreshold || 200
        };

        this.items = [];
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;

        this.viewport = null;
        this.content = null;
        this.spacerTop = null;
        this.spacerBottom = null;

        this.isLoading = false;
        this.hasMore = true;

        this.init();
    }

    init() {
        // Create structure
        this.container.innerHTML = '';
        this.container.style.overflow = 'auto';
        this.container.style.position = 'relative';

        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-viewport';
        this.viewport.style.position = 'relative';

        this.spacerTop = document.createElement('div');
        this.spacerTop.className = 'virtual-spacer-top';

        this.content = document.createElement('div');
        this.content.className = 'virtual-content';

        this.spacerBottom = document.createElement('div');
        this.spacerBottom.className = 'virtual-spacer-bottom';

        this.viewport.appendChild(this.spacerTop);
        this.viewport.appendChild(this.content);
        this.viewport.appendChild(this.spacerBottom);
        this.container.appendChild(this.viewport);

        // Bind scroll handler
        this.handleScroll = this.handleScroll.bind(this);
        this.container.addEventListener('scroll', this.handleScroll, { passive: true });

        // Observe container resize
        this.resizeObserver = new ResizeObserver(() => {
            this.containerHeight = this.container.clientHeight;
            this.render();
        });
        this.resizeObserver.observe(this.container);

        this.containerHeight = this.container.clientHeight;
    }

    setItems(items) {
        this.items = items;
        this.totalHeight = items.length * this.options.itemHeight;
        this.viewport.style.height = `${this.totalHeight}px`;
        this.render();
    }

    appendItems(newItems) {
        this.items = [...this.items, ...newItems];
        this.totalHeight = this.items.length * this.options.itemHeight;
        this.viewport.style.height = `${this.totalHeight}px`;
        this.isLoading = false;
        this.render();
    }

    handleScroll(e) {
        this.scrollTop = this.container.scrollTop;
        this.render();

        // Check if should load more
        if (this.options.onLoadMore && this.hasMore && !this.isLoading) {
            const scrollBottom = this.totalHeight - this.scrollTop - this.containerHeight;
            if (scrollBottom < this.options.loadMoreThreshold) {
                this.isLoading = true;
                this.options.onLoadMore();
            }
        }
    }

    render() {
        const { itemHeight, bufferSize, renderItem } = this.options;

        // Calculate visible range
        this.visibleStart = Math.max(0, Math.floor(this.scrollTop / itemHeight) - bufferSize);
        this.visibleEnd = Math.min(
            this.items.length,
            Math.ceil((this.scrollTop + this.containerHeight) / itemHeight) + bufferSize
        );

        // Update spacers
        this.spacerTop.style.height = `${this.visibleStart * itemHeight}px`;
        this.spacerBottom.style.height = `${(this.items.length - this.visibleEnd) * itemHeight}px`;

        // Render visible items
        const visibleItems = this.items.slice(this.visibleStart, this.visibleEnd);
        this.content.innerHTML = visibleItems.map((item, index) => {
            const globalIndex = this.visibleStart + index;
            return `<div class="virtual-item" data-index="${globalIndex}" style="height: ${itemHeight}px;">
        ${renderItem(item, globalIndex)}
      </div>`;
        }).join('');
    }

    scrollToIndex(index) {
        const top = index * this.options.itemHeight;
        this.container.scrollTo({ top, behavior: 'smooth' });
    }

    scrollToTop() {
        this.container.scrollTo({ top: 0, behavior: 'smooth' });
    }

    refresh() {
        this.render();
    }

    destroy() {
        this.container.removeEventListener('scroll', this.handleScroll);
        this.resizeObserver?.disconnect();
        this.container.innerHTML = '';
    }

    setHasMore(value) {
        this.hasMore = value;
    }

    setLoading(value) {
        this.isLoading = value;
    }
}

// Lazy loading for images
export class LazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: options.rootMargin || '100px',
            threshold: options.threshold || 0.1,
            loadingClass: options.loadingClass || 'lazy-loading',
            loadedClass: options.loadedClass || 'lazy-loaded',
            errorClass: options.errorClass || 'lazy-error',
            placeholder: options.placeholder || ''
        };

        this.observer = null;
        this.init();
    }

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.loadAllImages();
            return;
        }

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );
    }

    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
        }
    }

    unobserve(element) {
        if (this.observer) {
            this.observer.unobserve(element);
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    }

    loadImage(element) {
        const src = element.dataset.src;
        const srcset = element.dataset.srcset;

        if (!src && !srcset) return;

        element.classList.add(this.options.loadingClass);

        const img = new Image();

        img.onload = () => {
            if (element.tagName === 'IMG') {
                if (src) element.src = src;
                if (srcset) element.srcset = srcset;
            } else {
                element.style.backgroundImage = `url(${src})`;
            }
            element.classList.remove(this.options.loadingClass);
            element.classList.add(this.options.loadedClass);
        };

        img.onerror = () => {
            element.classList.remove(this.options.loadingClass);
            element.classList.add(this.options.errorClass);
        };

        if (srcset) img.srcset = srcset;
        if (src) img.src = src;
    }

    loadAllImages() {
        document.querySelectorAll('[data-src]').forEach(el => {
            this.loadImage(el);
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Infinite scroll handler
export function createInfiniteScroll(container, options = {}) {
    const {
        loadMore,
        threshold = 200,
        initialLoad = true
    } = options;

    let isLoading = false;
    let hasMore = true;

    const checkScroll = () => {
        if (isLoading || !hasMore) return;

        const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        if (scrollBottom < threshold) {
            isLoading = true;
            loadMore()
                .then((more) => {
                    hasMore = more !== false;
                    isLoading = false;
                })
                .catch(() => {
                    isLoading = false;
                });
        }
    };

    container.addEventListener('scroll', checkScroll, { passive: true });

    if (initialLoad) {
        checkScroll();
    }

    return {
        setHasMore(value) { hasMore = value; },
        setLoading(value) { isLoading = value; },
        check() { checkScroll(); },
        destroy() { container.removeEventListener('scroll', checkScroll); }
    };
}
