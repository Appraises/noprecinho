// Gamification utilities

const STORAGE_KEY = 'precoja_user';

// Default user data
const defaultUserData = {
    points: 0,
    reportsCount: 0,
    badges: [],
    joinedAt: new Date().toISOString()
};

// Get user data from localStorage
function getUserData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading user data:', e);
    }
    return { ...defaultUserData };
}

// Save user data to localStorage
function saveUserData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving user data:', e);
    }
}

// Get user points
export function getUserPoints() {
    return getUserData().points;
}

// Add points
export function addPoints(amount) {
    const data = getUserData();
    data.points += amount;
    data.reportsCount += 1;

    // Check for new badges
    checkBadges(data);

    saveUserData(data);
    return data.points;
}

// Get user badges
export function getUserBadges() {
    return getUserData().badges;
}

// Badge definitions
const BADGES = [
    {
        id: 'first_report',
        name: 'Primeiro Reporte',
        description: 'Reportou seu primeiro preço',
        icon: '🎯',
        condition: (data) => data.reportsCount >= 1
    },
    {
        id: 'reporter_10',
        name: 'Colaborador',
        description: 'Reportou 10 preços',
        icon: '⭐',
        condition: (data) => data.reportsCount >= 10
    },
    {
        id: 'reporter_50',
        name: 'Expert',
        description: 'Reportou 50 preços',
        icon: '🏆',
        condition: (data) => data.reportsCount >= 50
    },
    {
        id: 'points_100',
        name: 'Centurião',
        description: 'Alcançou 100 pontos',
        icon: '💯',
        condition: (data) => data.points >= 100
    },
    {
        id: 'points_500',
        name: 'Mestre dos Preços',
        description: 'Alcançou 500 pontos',
        icon: '👑',
        condition: (data) => data.points >= 500
    }
];

// Check and award new badges
function checkBadges(data) {
    BADGES.forEach(badge => {
        if (!data.badges.includes(badge.id) && badge.condition(data)) {
            data.badges.push(badge.id);
            // Could trigger a toast notification here
            console.log(`🎉 New badge unlocked: ${badge.name}`);
        }
    });
}

// Get badge info
export function getBadgeInfo(badgeId) {
    return BADGES.find(b => b.id === badgeId);
}

// Get all available badges
export function getAllBadges() {
    return BADGES;
}

// Get user's unlocked badges with info
export function getUnlockedBadges() {
    const userData = getUserData();
    return userData.badges.map(id => getBadgeInfo(id)).filter(Boolean);
}

// Reset user data (for testing)
export function resetUserData() {
    saveUserData({ ...defaultUserData });
}
