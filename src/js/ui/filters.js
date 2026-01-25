// Category filters component

let activeCategories = ['all'];
let onChangeCallback = null;

export function initFilters(onChange) {
    onChangeCallback = onChange;

    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;

    const chips = filterBar.querySelectorAll('.chip');

    chips.forEach(chip => {
        chip.addEventListener('click', () => handleChipClick(chip, chips));

        // Keyboard support
        chip.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleChipClick(chip, chips);
            }
        });
    });
}

function handleChipClick(chip, allChips) {
    const category = chip.dataset.category;

    if (category === 'all') {
        // Select only "Todos"
        activeCategories = ['all'];
        allChips.forEach(c => {
            c.classList.toggle('chip--active', c.dataset.category === 'all');
        });
    } else {
        // Toggle this category
        const allChip = document.querySelector('.chip[data-category="all"]');

        if (chip.classList.contains('chip--active')) {
            // Deselect
            chip.classList.remove('chip--active');
            activeCategories = activeCategories.filter(c => c !== category);

            // If none selected, select "all"
            if (activeCategories.length === 0 || (activeCategories.length === 1 && activeCategories[0] === 'all')) {
                activeCategories = ['all'];
                allChip?.classList.add('chip--active');
            }
        } else {
            // Select
            chip.classList.add('chip--active');

            // Remove "all" if selecting specific category
            allChip?.classList.remove('chip--active');
            activeCategories = activeCategories.filter(c => c !== 'all');
            activeCategories.push(category);
        }
    }

    // Notify callback
    if (onChangeCallback) {
        onChangeCallback([...activeCategories]);
    }
}

export function getActiveCategories() {
    return [...activeCategories];
}

export function setActiveCategories(categories) {
    activeCategories = [...categories];

    // Update UI
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        const category = chip.dataset.category;
        chip.classList.toggle('chip--active', categories.includes(category));
    });
}
