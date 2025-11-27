// --- DOM 요소 ---
let introWrapper, mainAppScreen, devModeButton, normalModeButton, introLoadButton, introLoadFileInput, aquarium, coinsDisplay, waterQualityBar, feedButton, cleanButton, breedButton, guppyInfoPanel, closeInfoPanelButton, infoBreedButton, infoRehomeButton, infoMoveButton, manualButton, guppyListButton, shopButton, collectionButton, modalContainer, prevAquariumButton, nextAquariumButton, aquariumTitle, saveButton, loadButton, loadFileInput, menuToggleButton, gameMenu;
let currentLanguage = localStorage.getItem('guppy_lang') || 'ko';

function t(key, params = {}) {
    const lang = currentLanguage;
    let text = TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key] || key;
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    return text;
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('guppy_lang', lang);
    document.documentElement.lang = lang;

    // Update static elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update dynamic elements if visible
    if (gameInitialized) {
        updateUI();
        // Re-render open modals if any (simplified: just close or refresh)
        // For now, let's just update main UI. Modals might need re-opening.
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Guppy Lab: DOM Content Loaded");
    introWrapper = document.getElementById('intro-wrapper');
    mainAppScreen = document.getElementById('main-app-screen');
    devModeButton = document.getElementById('dev-mode-button');
    normalModeButton = document.getElementById('normal-mode-button');
    introLoadButton = document.getElementById('intro-load-button');
    introLoadFileInput = document.getElementById('intro-load-file-input');
    aquarium = document.getElementById('aquarium');
    coinsDisplay = document.getElementById('coins-display');
    waterQualityBar = document.getElementById('water-quality-bar');
    feedButton = document.getElementById('feed-button');
    cleanButton = document.getElementById('clean-button');
    breedButton = document.getElementById('breed-button');
    guppyInfoPanel = document.getElementById('guppy-info-panel');
    closeInfoPanelButton = document.getElementById('close-info-panel');
    infoBreedButton = document.getElementById('info-breed-button');
    infoRehomeButton = document.getElementById('info-rehome-button');
    infoMoveButton = document.getElementById('info-move-button');
    manualButton = document.getElementById('manual-button');
    guppyListButton = document.getElementById('guppy-list-button');
    shopButton = document.getElementById('shop-button');
    collectionButton = document.getElementById('collection-button');
    modalContainer = document.getElementById('modal-container');
    prevAquariumButton = document.getElementById('prev-aquarium');
    nextAquariumButton = document.getElementById('next-aquarium');
    aquariumTitle = document.getElementById('aquarium-title');
    saveButton = document.getElementById('save-button');
    loadButton = document.getElementById('load-button');
    loadFileInput = document.getElementById('load-file-input');
    menuToggleButton = document.getElementById('menu-toggle-button');
    gameMenu = document.getElementById('game-menu');

    if (devModeButton) {
        devModeButton.addEventListener('click', () => startNewGame('developer'));
    }
    if (normalModeButton) {
        normalModeButton.addEventListener('click', () => startNewGame('normal'));
    }
    if (introLoadButton) {
        introLoadButton.addEventListener('click', () => introLoadFileInput.click());
    }
    if (introLoadFileInput) {
        introLoadFileInput.addEventListener('change', handleIntroLoad);
    }

    // Initialize other UI listeners here if needed, or keep them where they are but ensure elements exist
    setupEventListeners();

    if (saveButton) saveButton.addEventListener('click', exportSaveFile);
    if (loadButton) loadButton.addEventListener('click', () => loadFileInput.click());
    if (loadFileInput) loadFileInput.addEventListener('change', importSaveFile);

    if (menuToggleButton) {
        menuToggleButton.addEventListener('click', () => {
            gameMenu.classList.toggle('hidden');
            gameMenu.classList.toggle('flex');
        });
    }
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (gameMenu && !gameMenu.classList.contains('hidden') &&
            !gameMenu.contains(e.target) &&
            !menuToggleButton.contains(e.target)) {
            gameMenu.classList.add('hidden');
            gameMenu.classList.remove('flex');
        }
    });

    // Language Selector Listeners
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            setLanguage(e.target.dataset.lang);
        });
    });

    // Initialize Language
    setLanguage(currentLanguage);
});

// --- 게임 설정 및 데이터 ---
const ADULT_AGE = 20;
const MAX_HUNGER = 100;
const HUNGRY_THRESHOLD = 70;
const FEED_COST = 10;
const BREED_COOLDOWN = 20000; // 20 seconds
const PATTERN_TYPES = ['spots', 'stripes', 'h_stripes', 'v_stripes', 'freckles', 'half', 'rings', 'checker', 'gradient'];
const SHOP_ITEMS = [
    { id: 'plant1', type: 'decoration', nameKey: 'item_plant1', price: 50, effect: { waterQuality: 0.02 }, svg: `<svg width="50" height="100" viewBox="0 0 50 100"><path d="M25 100 C 10 80, 40 60, 25 40 S 10 20, 25 0" stroke="cyan" stroke-width="4" fill="none" /></svg>` },
    { id: 'guppy_spots', type: 'guppy', nameKey: 'item_guppy_spots', price: 100, gender: 'male', pattern: { type: 'spots', colors: [{ r: 255, g: 100, b: 100 }, { r: 255, g: 200, b: 200 }] } },
    { id: 'guppy_spots_f', type: 'guppy', nameKey: 'item_guppy_spots', price: 100, gender: 'female', pattern: { type: 'spots', colors: [{ r: 255, g: 100, b: 100 }, { r: 255, g: 200, b: 200 }] } },
    { id: 'guppy_stripes', type: 'guppy', nameKey: 'item_guppy_stripes', price: 120, gender: 'male', pattern: { type: 'stripes', colors: [{ r: 100, g: 100, b: 255 }, { r: 200, g: 200, b: 255 }] } },
    { id: 'guppy_stripes_f', type: 'guppy', nameKey: 'item_guppy_stripes', price: 120, gender: 'female', pattern: { type: 'stripes', colors: [{ r: 100, g: 100, b: 255 }, { r: 200, g: 200, b: 255 }] } },
    { id: 'guppy_h_stripes', type: 'guppy', nameKey: 'item_guppy_h_stripes', price: 130, gender: 'male', pattern: { type: 'h_stripes', colors: [{ r: 100, g: 255, b: 100 }, { r: 200, g: 255, b: 200 }] } },
    { id: 'guppy_h_stripes_f', type: 'guppy', nameKey: 'item_guppy_h_stripes', price: 130, gender: 'female', pattern: { type: 'h_stripes', colors: [{ r: 100, g: 255, b: 100 }, { r: 200, g: 255, b: 200 }] } },
    { id: 'guppy_v_stripes', type: 'guppy', nameKey: 'item_guppy_v_stripes', price: 130, gender: 'male', pattern: { type: 'v_stripes', colors: [{ r: 255, g: 255, b: 100 }, { r: 255, g: 255, b: 200 }] } },
    { id: 'guppy_v_stripes_f', type: 'guppy', nameKey: 'item_guppy_v_stripes', price: 130, gender: 'female', pattern: { type: 'v_stripes', colors: [{ r: 255, g: 255, b: 100 }, { r: 255, g: 255, b: 200 }] } },
    { id: 'guppy_freckles', type: 'guppy', nameKey: 'item_guppy_freckles', price: 140, gender: 'male', pattern: { type: 'freckles', colors: [{ r: 255, g: 150, b: 50 }, { r: 255, g: 200, b: 150 }] } },
    { id: 'guppy_freckles_f', type: 'guppy', nameKey: 'item_guppy_freckles', price: 140, gender: 'female', pattern: { type: 'freckles', colors: [{ r: 255, g: 150, b: 50 }, { r: 255, g: 200, b: 150 }] } },
    { id: 'guppy_half', type: 'guppy', nameKey: 'item_guppy_half', price: 150, gender: 'male', pattern: { type: 'half', colors: [{ r: 50, g: 50, b: 50 }, { r: 200, g: 200, b: 200 }] } },
    { id: 'guppy_half_f', type: 'guppy', nameKey: 'item_guppy_half', price: 150, gender: 'female', pattern: { type: 'half', colors: [{ r: 50, g: 50, b: 50 }, { r: 200, g: 200, b: 200 }] } },
    { id: 'guppy_rings', type: 'guppy', nameKey: 'item_guppy_rings', price: 160, gender: 'male', pattern: { type: 'rings', colors: [{ r: 255, g: 50, b: 255 }, { r: 255, g: 150, b: 255 }] } },
    { id: 'guppy_rings_f', type: 'guppy', nameKey: 'item_guppy_rings', price: 160, gender: 'female', pattern: { type: 'rings', colors: [{ r: 255, g: 50, b: 255 }, { r: 255, g: 150, b: 255 }] } },
    { id: 'guppy_checker', type: 'guppy', nameKey: 'item_guppy_checker', price: 170, gender: 'male', pattern: { type: 'checker', colors: [{ r: 50, g: 255, b: 255 }, { r: 150, g: 255, b: 255 }] } },
    { id: 'guppy_checker_f', type: 'guppy', nameKey: 'item_guppy_checker', price: 170, gender: 'female', pattern: { type: 'checker', colors: [{ r: 50, g: 255, b: 255 }, { r: 150, g: 255, b: 255 }] } },
    { id: 'guppy_gradient', type: 'guppy', nameKey: 'item_guppy_gradient', price: 200, gender: 'male', pattern: { type: 'gradient', colors: [{ r: 255, g: 100, b: 255 }, { r: 100, g: 255, b: 255 }] } },
    { id: 'guppy_gradient_f', type: 'guppy', nameKey: 'item_guppy_gradient', price: 200, gender: 'female', pattern: { type: 'gradient', colors: [{ r: 255, g: 100, b: 255 }, { r: 100, g: 255, b: 255 }] } },
    { id: 'aquarium_new', type: 'aquarium', nameKey: 'item_aquarium_new', price: 500 },
];

const COLLECTION_TARGETS = [
    { id: 'panda', nameKey: 'col_panda', hintKey: 'col_panda_hint', criteria: { patternType: 'spots', bodyColor: { r: 255, g: 255, b: 255 }, patternColor: { r: 0, g: 0, b: 0 }, tolerance: 50 } },
    { id: 'bumblebee', nameKey: 'col_bumblebee', hintKey: 'col_bumblebee_hint', criteria: { patternType: 'stripes', bodyColor: { r: 255, g: 255, b: 0 }, patternColor: { r: 0, g: 0, b: 0 }, tolerance: 50 } },
    { id: 'tiger', nameKey: 'col_tiger', hintKey: 'col_tiger_hint', criteria: { patternType: 'stripes', bodyColor: { r: 255, g: 165, b: 0 }, patternColor: { r: 0, g: 0, b: 0 }, tolerance: 50 } },
    { id: 'zebra', nameKey: 'col_zebra', hintKey: 'col_zebra_hint', criteria: { patternType: 'v_stripes', bodyColor: { r: 255, g: 255, b: 255 }, patternColor: { r: 0, g: 0, b: 0 }, tolerance: 50 } },
    { id: 'watermelon', nameKey: 'col_watermelon', hintKey: 'col_watermelon_hint', criteria: { patternType: 'stripes', bodyColor: { r: 0, g: 255, b: 0 }, patternColor: { r: 0, g: 0, b: 0 }, tolerance: 50 } },
    { id: 'mint_choco', nameKey: 'col_mint_choco', hintKey: 'col_mint_choco_hint', criteria: { patternType: 'freckles', bodyColor: { r: 0, g: 255, b: 255 }, patternColor: { r: 139, g: 69, b: 19 }, tolerance: 60 } },
    { id: 'nemo', nameKey: 'col_nemo', hintKey: 'col_nemo_hint', criteria: { patternType: 'stripes', bodyColor: { r: 255, g: 165, b: 0 }, patternColor: { r: 255, g: 255, b: 255 }, tolerance: 50 } },
    { id: 'blue_sky', nameKey: 'col_blue_sky', hintKey: 'col_blue_sky_hint', criteria: { patternType: 'gradient', bodyColor: { r: 135, g: 206, b: 235 }, patternColor: { r: 255, g: 255, b: 255 }, tolerance: 50 } },
    { id: 'sunset', nameKey: 'col_sunset', hintKey: 'col_sunset_hint', criteria: { patternType: 'gradient', bodyColor: { r: 255, g: 165, b: 0 }, patternColor: { r: 128, g: 0, b: 128 }, tolerance: 50 } },
    { id: 'fire', nameKey: 'col_fire', hintKey: 'col_fire_hint', criteria: { patternType: 'gradient', bodyColor: { r: 255, g: 0, b: 0 }, patternColor: { r: 255, g: 255, b: 0 }, tolerance: 50 } },
    { id: 'ocean', nameKey: 'col_ocean', hintKey: 'col_ocean_hint', criteria: { patternType: 'gradient', bodyColor: { r: 0, g: 0, b: 128 }, patternColor: { r: 0, g: 255, b: 255 }, tolerance: 50 } },
    { id: 'matrix', nameKey: 'col_matrix', hintKey: 'col_matrix_hint', criteria: { patternType: 'h_stripes', bodyColor: { r: 0, g: 0, b: 0 }, patternColor: { r: 0, g: 255, b: 0 }, tolerance: 50 } },
    { id: 'goldfish', nameKey: 'col_goldfish', hintKey: 'col_goldfish_hint', criteria: { patternType: 'gradient', bodyColor: { r: 255, g: 215, b: 0 }, patternColor: { r: 255, g: 165, b: 0 }, tolerance: 50 } },
    { id: 'ghost', nameKey: 'col_ghost', hintKey: 'col_ghost_hint', criteria: { patternType: 'any', bodyColor: { r: 255, g: 255, b: 255 }, patternColor: { r: 255, g: 255, b: 255 }, tolerance: 30 } },
    { id: 'shadow', nameKey: 'col_shadow', hintKey: 'col_shadow_hint', criteria: { patternType: 'any', bodyColor: { r: 0, g: 0, b: 0 }, patternColor: { r: 0, g: 0, b: 0 }, tolerance: 30 } },
    { id: 'love', nameKey: 'col_love', hintKey: 'col_love_hint', criteria: { patternType: 'spots', bodyColor: { r: 255, g: 192, b: 203 }, patternColor: { r: 255, g: 0, b: 0 }, tolerance: 50 } },
    { id: 'toxic', nameKey: 'col_toxic', hintKey: 'col_toxic_hint', criteria: { patternType: 'rings', bodyColor: { r: 0, g: 255, b: 0 }, patternColor: { r: 128, g: 0, b: 128 }, tolerance: 50 } },
    { id: 'cotton_candy', nameKey: 'col_cotton_candy', hintKey: 'col_cotton_candy_hint', criteria: { patternType: 'gradient', bodyColor: { r: 255, g: 192, b: 203 }, patternColor: { r: 135, g: 206, b: 235 }, tolerance: 50 } },
    { id: 'leopard', nameKey: 'col_leopard', hintKey: 'col_leopard_hint', criteria: { patternType: 'spots', bodyColor: { r: 255, g: 255, b: 0 }, patternColor: { r: 139, g: 69, b: 19 }, tolerance: 50 } },
    { id: 'galaxy', nameKey: 'col_galaxy', hintKey: 'col_galaxy_hint', criteria: { patternType: 'freckles', bodyColor: { r: 0, g: 0, b: 0 }, patternColor: { r: 128, g: 0, b: 128 }, tolerance: 50 } },
];

let gameState = {
    aquariums: [{ guppies: [], decorations: [], waterQuality: 100, food: [] }],
    currentAquariumIndex: 0,
    nextGuppyId: 0,
    coins: 100,
    discoveredPatterns: new Set(), // Keep for backward compatibility or general discovery
    unlockedCollection: [], // Array of unlocked target IDs
    isBreedingMode: false,
    breedingParents: [],
    currentInfoGuppyId: null,
    isPaused: false,
    gameMode: 'developer', // 'developer' or 'normal'
    shopPrices: {}, // Stores randomized prices for normal mode
};
let gameInitialized = false;

const toRgbString = (color) => `rgb(${color.r}, ${color.g}, ${color.b})`;
const roundToFive = (v) => Math.round(v / 5) * 5;

class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.element = null;
        this.createElement();
    }
    createElement() {
        const el = document.createElement('div');
        el.className = 'food-pellet';
        el.style.left = `${this.x}px`;
        el.style.top = `${this.y}px`;
        aquarium.appendChild(el);
        this.element = el;
    }
    sink() {
        if (!this.element) return;
        this.y += 0.5;
        this.element.style.top = `${this.y}px`;
    }
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

class Guppy {
    constructor(id, pattern, age = 0, parents = null, hunger = 0, lastBredTime = 0, x = null, y = null, gender = 'male') {
        this.id = id; this.pattern = pattern; this.age = age; this.parents = parents; this.hunger = hunger;
        this.lastBredTime = lastBredTime;
        this.gender = gender;
        this.stage = this.age >= ADULT_AGE ? 'adult' : 'fry';

        const containerWidth = aquarium.clientWidth || 800;
        const containerHeight = aquarium.clientHeight || 400;

        // Ensure x and y are valid numbers
        const isValid = (val) => typeof val === 'number' && isFinite(val);

        this.x = isValid(x) ? x : Math.random() * (containerWidth - 50);
        this.y = isValid(y) ? y : Math.random() * (containerHeight - 25);

        this.target = null; this.speed = 1 + Math.random() * 1.5; this.isFlipped = false;
        this.nibbleTargetX = null;
        this.element = null;
    }

    createElement() {
        try {
            console.log(`Creating element for guppy ${this.id} at ${this.x}, ${this.y}`);
            const guppyEl = document.createElement('div');
            guppyEl.className = 'guppy';
            guppyEl.dataset.id = this.id;
            guppyEl.style.left = `${this.x}px`;
            guppyEl.style.top = `${this.y}px`;

            guppyEl.innerHTML = this.getGuppySVG();

            guppyEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (gameState.isBreedingMode) {
                    selectBreedingGuppy(this);
                } else {
                    showGuppyInfo(this);
                }
            });
            aquarium.appendChild(guppyEl);
            this.element = guppyEl;
            this.updateAppearance();
            console.log(`Element created for guppy ${this.id}`);
        } catch (e) {
            console.error(`Error creating element for guppy ${this.id}:`, e);
        }
    }

    getGuppySVG() {
        let bodyPath, tailPath, dorsalFinPath, pectoralFinPath;

        if (this.gender === 'female') {
            // Female: Rounder belly, round fan-shaped tail, less flashy fins
            bodyPath = "M10,15 Q25,0 45,15 Q25,35 10,15 Z"; // Rounder belly
            tailPath = "M40,15 Q45,5 55,10 Q60,15 55,20 Q45,25 40,15 Z"; // Round fan shape
            dorsalFinPath = "M25,10 Q30,5 35,10 Z"; // Smaller dorsal fin
            pectoralFinPath = "M28,18 Q32,20 28,22 Z"; // Smaller pectoral fin
        } else {
            // Male: Streamlined body, flowing tail (Original)
            bodyPath = "M10,15 Q25,5 45,15 Q25,25 10,15 Z";
            tailPath = "M40,15 Q55,0 65,5 Q70,15 65,25 Q55,30 40,15 Z";
            dorsalFinPath = "M25,10 Q35,0 40,10 Z";
            pectoralFinPath = "M28,18 Q35,22 28,24 Z";
        }

        const eyeCircle = '<circle cx="15" cy="13" r="1.5" fill="black" /><circle cx="16" cy="12" r="0.5" fill="white" />';

        // Calculate colors for static rendering
        const c1 = this.pattern.colors[0];
        const c2 = this.pattern.colors[1] || c1;
        const bodyColor1 = toRgbString(c1);
        const bodyColor2 = toRgbString(c2);
        const tailC1 = { r: Math.min(255, c1.r + 20), g: Math.min(255, c1.g + 20), b: Math.min(255, c1.b + 20) };
        const tailC2 = { r: Math.min(255, c2.r + 20), g: Math.min(255, c2.g + 20), b: Math.min(255, c2.b + 20) };
        const tailColor1 = toRgbString(tailC1);
        const tailColor2 = toRgbString(tailC2);

        // Generate Pattern SVG
        let patternSVG = '';
        const pType = this.pattern.type;
        const pColor = toRgbString(c2); // Use secondary color for pattern
        const pOpacity = 0.7;

        if (pType === 'spots') {
            patternSVG = `
                <circle cx="20" cy="15" r="2.5" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="30" cy="10" r="2" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="35" cy="20" r="2.5" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="42" cy="15" r="1.5" fill="${pColor}" opacity="${pOpacity}" />
            `;
        } else if (pType === 'stripes') {
            patternSVG = `
                <path d="M15,25 L25,5 M25,25 L35,5 M35,25 L45,5" stroke="${pColor}" stroke-width="2" opacity="${pOpacity}" />
            `;
        } else if (pType === 'h_stripes') {
            patternSVG = `
                <line x1="10" y1="12" x2="50" y2="12" stroke="${pColor}" stroke-width="1.5" opacity="${pOpacity}" />
                <line x1="10" y1="18" x2="50" y2="18" stroke="${pColor}" stroke-width="1.5" opacity="${pOpacity}" />
            `;
        } else if (pType === 'v_stripes') {
            patternSVG = `
                <line x1="20" y1="5" x2="20" y2="25" stroke="${pColor}" stroke-width="1.5" opacity="${pOpacity}" />
                <line x1="30" y1="5" x2="30" y2="25" stroke="${pColor}" stroke-width="1.5" opacity="${pOpacity}" />
                <line x1="40" y1="5" x2="40" y2="25" stroke="${pColor}" stroke-width="1.5" opacity="${pOpacity}" />
            `;
        } else if (pType === 'freckles') {
            patternSVG = `
                <filter id="noise-${this.id}">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                </filter>
                <rect x="10" y="5" width="40" height="20" fill="${pColor}" opacity="0.4" filter="url(#noise-${this.id})" />
            `;
            // Fallback/Alternative for freckles if filter is too heavy or complex: simple dots
            patternSVG = `
                <circle cx="18" cy="12" r="0.8" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="22" cy="18" r="0.8" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="28" cy="14" r="0.8" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="34" cy="19" r="0.8" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="38" cy="13" r="0.8" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="25" cy="10" r="0.8" fill="${pColor}" opacity="${pOpacity}" />
                <circle cx="42" cy="17" r="0.8" fill="${pColor}" opacity="${pOpacity}" />
             `;
        } else if (pType === 'half') {
            patternSVG = `
                <rect x="30" y="0" width="30" height="30" fill="${pColor}" opacity="${pOpacity}" />
            `;
        } else if (pType === 'rings') {
            patternSVG = `
                <circle cx="25" cy="15" r="4" stroke="${pColor}" stroke-width="1.5" fill="none" opacity="${pOpacity}" />
                <circle cx="38" cy="15" r="4" stroke="${pColor}" stroke-width="1.5" fill="none" opacity="${pOpacity}" />
            `;
        } else if (pType === 'checker') {
            patternSVG = `
                <rect x="20" y="10" width="5" height="5" fill="${pColor}" opacity="${pOpacity}" />
                <rect x="30" y="10" width="5" height="5" fill="${pColor}" opacity="${pOpacity}" />
                <rect x="40" y="10" width="5" height="5" fill="${pColor}" opacity="${pOpacity}" />
                <rect x="25" y="15" width="5" height="5" fill="${pColor}" opacity="${pOpacity}" />
                <rect x="35" y="15" width="5" height="5" fill="${pColor}" opacity="${pOpacity}" />
             `;
        }

        return `
            <svg viewBox="0 0 80 30" width="100%" height="100%" style="overflow: visible;">
                <defs>
                    <linearGradient id="bodyGradient-${this.id}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="${bodyColor1}" class="body-color-1" />
                        <stop offset="100%" stop-color="${bodyColor2}" class="body-color-2" />
                    </linearGradient>
                    <radialGradient id="tailGradient-${this.id}" cx="0%" cy="50%" r="100%">
                        <stop offset="0%" stop-color="${tailColor1}" class="tail-color-1" />
                        <stop offset="100%" stop-color="${tailColor2}" class="tail-color-2" />
                    </radialGradient>
                    <clipPath id="bodyClip-${this.id}">
                        <path d="${bodyPath}" />
                    </clipPath>
                </defs>
                <g class="guppy-group">
                    <path d="${tailPath}" fill="url(#tailGradient-${this.id})" class="guppy-tail-svg" />
                    <path d="${dorsalFinPath}" fill="url(#tailGradient-${this.id})" class="guppy-dorsal-fin" opacity="0.8" />
                    
                    <!-- Body Group with Pattern -->
                    <g>
                        <path d="${bodyPath}" fill="url(#bodyGradient-${this.id})" class="guppy-body" />
                        <g clip-path="url(#bodyClip-${this.id})">
                            ${patternSVG}
                        </g>
                    </g>
                    
                    <path d="${pectoralFinPath}" fill="rgba(255,255,255,0.5)" class="guppy-pectoral-fin" />
                    ${eyeCircle}
                </g>
            </svg>
        `;
    }

    updateAppearance() {
        if (!this.element) return;
        try {
            const isAdult = this.stage === 'adult';
            const width = isAdult ? 60 : 35;
            const height = isAdult ? 30 : 18;
            this.element.style.width = `${width}px`;
            this.element.style.height = `${height}px`;

            if (!this.pattern || !this.pattern.colors) {
                console.error(`Guppy ${this.id} has invalid pattern:`, this.pattern);
                return;
            }

            const c1 = this.pattern.colors[0];
            const c2 = this.pattern.colors[1] || c1;

            const bodyColor1 = toRgbString(c1);
            const bodyColor2 = toRgbString(c2);

            const tailC1 = { r: Math.min(255, c1.r + 20), g: Math.min(255, c1.g + 20), b: Math.min(255, c1.b + 20) };
            const tailC2 = { r: Math.min(255, c2.r + 20), g: Math.min(255, c2.g + 20), b: Math.min(255, c2.b + 20) };
            const tailColor1 = toRgbString(tailC1);
            const tailColor2 = toRgbString(tailC2);

            const svg = this.element.querySelector('svg');
            if (svg) {
                const bodyStop1 = svg.querySelector(`#bodyGradient-${this.id} .body-color-1`);
                const bodyStop2 = svg.querySelector(`#bodyGradient-${this.id} .body-color-2`);
                const tailStop1 = svg.querySelector(`#tailGradient-${this.id} .tail-color-1`);
                const tailStop2 = svg.querySelector(`#tailGradient-${this.id} .tail-color-2`);

                if (bodyStop1) bodyStop1.setAttribute('stop-color', bodyColor1);
                if (bodyStop2) bodyStop2.setAttribute('stop-color', bodyColor2);
                if (tailStop1) tailStop1.setAttribute('stop-color', tailColor1);
                if (tailStop2) tailStop2.setAttribute('stop-color', tailColor2);
            }
        } catch (e) {
            console.error(`Error updating appearance for guppy ${this.id}:`, e);
        }
    }

    grow() {
        this.age++; this.hunger = Math.min(MAX_HUNGER, this.hunger + 1);
        if (this.stage === 'fry' && this.age >= ADULT_AGE) { this.stage = 'adult'; this.updateAppearance(); }
    }

    decideBehavior(aquariumState) {
        if (aquariumState.food.length > 0) {
            this.nibbleTargetX = null;
            let closestFood = null; let minDistance = Infinity;
            for (const food of aquariumState.food) {
                const distance = Math.hypot(this.x - food.x, this.y - food.y);
                if (distance < minDistance) { minDistance = distance; closestFood = food; }
            }
            this.target = closestFood; return;
        }
        if (this.hunger > HUNGRY_THRESHOLD) {
            if (this.nibbleTargetX === null || Math.abs(this.x - this.nibbleTargetX) < 10) {
                const guppyWidth = this.stage === 'adult' ? 50 : 30;
                const containerWidth = aquarium.clientWidth || 800;
                this.nibbleTargetX = Math.random() * (containerWidth - guppyWidth);
            }
            this.target = { x: this.nibbleTargetX, y: 10 }; return;
        }

        this.nibbleTargetX = null;
        if (!this.target || (this.target && !aquariumState.food.includes(this.target))) {
            const containerWidth = aquarium.clientWidth || 800;
            const containerHeight = aquarium.clientHeight || 400;
            this.target = { x: Math.random() * (containerWidth - 50), y: Math.random() * (containerHeight - 25) };
        }
    }

    updatePosition(aquariumState) {
        if (!this.target || !this.element) return;
        const dx = this.target.x - this.x; const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (this.hunger > HUNGRY_THRESHOLD && aquariumState.food.length === 0 && this.y < 30) {
            this.element.classList.add('nibbling');
            this.element.style.transform = 'scaleX(1) rotate(-45deg)';
        } else {
            this.element.classList.remove('nibbling');

            const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

            if (dx >= 0) {
                this.element.style.transform = `scaleX(-1) rotate(${-angleDeg}deg)`;
            } else {
                this.element.style.transform = `scaleX(1) rotate(${angleDeg - 180}deg)`;
            }
        }

        if (distance < this.speed) {
            if (this.target.constructor.name === 'Food') {
                this.hunger = Math.max(0, this.hunger - 50); this.target.destroy();
                aquariumState.food = aquariumState.food.filter(f => f !== this.target);
            }
            this.target = null; return;
        }

        // Move towards target
        const moveX = (dx / distance) * this.speed;
        const moveY = (dy / distance) * this.speed;

        this.x += moveX;
        this.y += moveY;

        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    toJSON() {
        const { element, target, ...rest } = this;
        return rest;
    }
}

class Decoration {
    constructor(item, x) {
        this.item = item;
        this.x = x;
        this.element = null;
    }

    createElement() {
        const el = document.createElement('div');
        el.className = 'decoration';
        el.innerHTML = this.item.svg;
        el.style.left = `${this.x}%`;
        aquarium.appendChild(el);
        this.element = el;
    }
}

function breedGuppies(parent1, parent2) {
    const inheritance = {};

    inheritance.pattern = Math.random() < 0.5 ? 1 : 2;
    const newPatternType = inheritance.pattern === 1 ? parent1.pattern.type : parent2.pattern.type;

    const newColors = [];
    inheritance.colors = [];

    const colorSlots = 2;

    for (let i = 0; i < colorSlots; i++) {
        const p1Color = parent1.pattern.colors[i] || parent1.pattern.colors[0];
        const p2Color = parent2.pattern.colors[i] || parent2.pattern.colors[0];

        const inheritFromParent1 = Math.random() < 0.5;
        const inheritedColor = inheritFromParent1 ? p1Color : p2Color;

        inheritance.colors.push({ from: inheritFromParent1 ? 1 : 2 });

        const newR = roundToFive(Math.max(0, Math.min(255, inheritedColor.r + Math.floor((Math.random() - 0.5) * 20))));
        const newG = roundToFive(Math.max(0, Math.min(255, inheritedColor.g + Math.floor((Math.random() - 0.5) * 20))));
        const newB = roundToFive(Math.max(0, Math.min(255, inheritedColor.b + Math.floor((Math.random() - 0.5) * 20))));

        newColors.push({ r: newR, g: newG, b: newB });
    }

    const newPattern = { type: newPatternType, colors: newColors };
    const patternKey = getPatternKey(newPattern);

    // Developer Mode: Reward for new patterns
    if (gameState.gameMode === 'developer' && !gameState.discoveredPatterns.has(patternKey)) {
        gameState.discoveredPatterns.add(patternKey);
        gameState.coins += 50;
        showToast(t('msg_coin_reward', { amount: 50 }));
    } else if (gameState.gameMode === 'normal' && !gameState.discoveredPatterns.has(patternKey)) {
        // Normal Mode: Just discover, no coin reward
        gameState.discoveredPatterns.add(patternKey);
        showToast(t('msg_new_discovery'));
    }
    const newId = gameState.nextGuppyId++;
    const newGender = Math.random() < 0.5 ? 'male' : 'female';
    const newGuppy = new Guppy(newId, newPattern, 0, null, 0, 0, null, null, newGender);

    checkCollectionUnlock(newGuppy);

    newGuppy.x = (parent1.x + parent2.x) / 2;
    newGuppy.y = (parent1.y + parent2.y) / 2;

    gameState.aquariums[gameState.currentAquariumIndex].guppies.push(newGuppy);
    newGuppy.createElement();

    return { newGuppy, inheritance };
}
function calculateGuppyValue(guppy) {
    if (gameState.gameMode === 'normal') {
        // Normal Mode: Price based on age, max 200
        // Age 20 is adult. Let's say 10 gold per age unit?
        // Fry (age 0-19): 0 to 190
        // Adult (age 20+): 200
        return Math.min(200, guppy.age * 10);
    }

    // Developer Mode (Original Logic)
    if (guppy.stage !== 'adult') return 0;
    let value = 10;
    const patternValues = { spots: 15, stripes: 20, h_stripes: 20, v_stripes: 20, freckles: 25, half: 30, rings: 35, checker: 40, gradient: 50 };
    value += patternValues[guppy.pattern.type] || 0;
    guppy.pattern.colors.forEach(c => {
        const avg = (c.r + c.g + c.b) / 3;
        const stdDev = Math.sqrt(((c.r - avg) ** 2 + (c.g - avg) ** 2 + (c.b - avg) ** 2) / 3);
        value += Math.floor(stdDev / 10);
    });
    if (guppy.pattern.colors.length > 1) {
        const c1 = guppy.pattern.colors[0];
        const c2 = guppy.pattern.colors[1];
        const colorDiff = Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);
        value += Math.floor(colorDiff / 50);
    }
    return value;
}
function rehomeGuppy(guppyId) {
    const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
    const guppyIndex = currentAq.guppies.findIndex(g => g.id === guppyId);
    if (guppyIndex === -1) return;
    const guppy = currentAq.guppies[guppyIndex];
    const value = calculateGuppyValue(guppy);
    if (value === 0) {
        showToast(t('msg_fry_rehome_fail'));
        return;
    }
    showConfirmation(t('msg_rehome_confirm', { amount: value }), () => {
        console.log(`Rehoming guppy ${guppyId}...`);
        gameState.coins += value;

        // Try to destroy via method if available
        if (typeof guppy.destroy === 'function') {
            console.log("Calling guppy.destroy()...");
            guppy.destroy();
        } else {
            console.warn("guppy.destroy is NOT a function. Manually removing element.");
            if (guppy.element) guppy.element.remove();
        }

        // Fallback: Try to remove by ID if element reference was lost or manual removal failed
        const selector = `.guppy[data-id="${guppyId}"]`;
        const el = document.querySelector(selector);
        if (el) {
            console.log(`Fallback: Removing element found by '${selector}'`);
            el.remove();
        }

        currentAq.guppies.splice(guppyIndex, 1);
        gameState.breedingParents = gameState.breedingParents.filter(p => p.id !== guppyId);

        updateUI();

        const modal = document.getElementById('guppy-list-modal');
        if (modal) {
            modal.remove();
            openGuppyList(); // Refresh the list
        }

        showToast(t('msg_coin_earned', { amount: value }));
    });
}
function showConfirmation(message, onConfirm) {
    const confirmModal = document.createElement('div');
    confirmModal.id = 'confirm-modal';
    confirmModal.className = 'modal-overlay';
    confirmModal.innerHTML = `
        <div class="modal-content text-center">
            <p id="confirm-message" class="text-lg mb-6">${message}</p>
            <div class="flex justify-center space-x-4">
                <button id="confirm-yes-button" class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-8 rounded-lg">${t('modal_confirm_yes')}</button>
                <button id="confirm-no-button" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg">${t('modal_confirm_no')}</button>
            </div>
        </div>`;
    modalContainer.appendChild(confirmModal);

    const yesHandler = () => {
        try {
            onConfirm();
        } catch (e) {
            console.error("Error in confirmation handler:", e);
        } finally {
            if (modalContainer.contains(confirmModal)) {
                modalContainer.removeChild(confirmModal);
            }
        }
    };
    const noHandler = () => {
        if (modalContainer.contains(confirmModal)) {
            modalContainer.removeChild(confirmModal);
        }
    };

    confirmModal.querySelector('#confirm-yes-button').addEventListener('click', yesHandler);
    confirmModal.querySelector('#confirm-no-button').addEventListener('click', noHandler);
}
function updateUI() {
    const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
    coinsDisplay.textContent = gameState.coins;
    waterQualityBar.style.width = `${currentAq.waterQuality}%`;
    aquariumTitle.textContent = `수조 ${gameState.currentAquariumIndex + 1} / ${gameState.aquariums.length}`;
    updateAquariumNav();
}
function saveGame() {
    // Auto-save disabled as per user request.
    // Only manual save to external file is supported.
}

async function exportSaveFile() {
    const plainState = JSON.parse(JSON.stringify(gameState));
    plainState.aquariums.forEach(aq => {
        aq.guppies.forEach(g => {
            delete g.element;
            delete g.target;
        });
        aq.decorations.forEach(d => delete d.element);
        aq.food = [];
    });
    plainState.discoveredPatterns = Array.from(plainState.discoveredPatterns);
    // unlockedCollection is already an array, so it saves directly

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHmmss
    const modeLabel = gameState.gameMode || 'unknown';
    const filename = `GuppyLab_${modeLabel}_${timestamp}.json`;
    const jsonString = JSON.stringify(plainState);

    try {
        if (window.showSaveFilePicker) {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'JSON File',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            showToast(t('msg_save_success'));
        } else {
            // Fallback for browsers not supporting File System Access API
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", url);
            downloadAnchorNode.setAttribute("download", filename);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            URL.revokeObjectURL(url);
            showToast(t('msg_save_success'));
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Save failed:', err);
            showToast(t('msg_save_fail'));
        }
    }
}

function importSaveFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const loadedState = JSON.parse(e.target.result);
            restoreGameState(loadedState);
            showToast(t('msg_load_success'));
        } catch (error) {
            console.error("Error importing save file:", error);
            showToast(t('msg_load_fail'));
        }
        event.target.value = ''; // Reset input
    };
    reader.readAsText(file);
}

function handleIntroLoad(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const loadedState = JSON.parse(e.target.result);
            restoreGameState(loadedState);

            gameInitialized = true;
            init(false); // Don't create default guppies
            showGameScreen();

            showToast(t('msg_load_success'));
        } catch (error) {
            console.error("Error importing save file:", error);
            showToast(t('msg_load_fail'));
        }
        event.target.value = ''; // Reset input
    };
    reader.readAsText(file);
}

function restoreGameState(loadedState) {
    gameState = { ...gameState, ...loadedState };
    gameState.discoveredPatterns = new Set(loadedState.discoveredPatterns);
    if (!gameState.unlockedCollection) gameState.unlockedCollection = [];

    // Clear existing elements
    gameState.aquariums.forEach(aq => {
        if (aq.guppies) aq.guppies.forEach(g => { if (g.element) g.element.remove(); });
        if (aq.decorations) aq.decorations.forEach(d => { if (d.element) d.element.remove(); });
    });
    aquarium.innerHTML = ''; // Clear aquarium container

    gameState.aquariums.forEach((aqData, index) => {
        console.log(`Loading aquarium ${index}, guppies: ${aqData.guppies.length}`);
        const guppies = aqData.guppies.map(gData => {
            if (!gData.pattern || !gData.pattern.colors) {
                console.warn(`Guppy ${gData.id} has invalid pattern in save, using default`);
                gData.pattern = { type: 'spots', colors: [{ r: 200, g: 200, b: 200 }] };
            }
            let safeX = gData.x;
            let safeY = gData.y;
            if (typeof safeX !== 'number' || !isFinite(safeX)) safeX = null;
            if (typeof safeY !== 'number' || !isFinite(safeY)) safeY = null;

            return new Guppy(gData.id, gData.pattern, gData.age, gData.parents, gData.hunger, gData.lastBredTime || 0, safeX, safeY, gData.gender || 'male');
        });
        const decorations = aqData.decorations.map(dData => {
            const item = SHOP_ITEMS.find(i => i.id === dData.item.id);
            return new Decoration(item, dData.x);
        });
        aqData.guppies = guppies;
        aqData.decorations = decorations;
        aqData.food = [];
    });

    // Re-create elements for current aquarium
    const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
    currentAq.guppies.forEach(g => g.createElement());
    currentAq.decorations.forEach(d => d.createElement());

    updateUI();
}

function loadGame() {
    // LocalStorage load disabled.
    return false;
}
function renderLoop() {
    if (!gameState.isPaused) {
        const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
        currentAq.food.forEach((food, index) => {
            food.sink();
            if (food.y > aquarium.clientHeight) { food.destroy(); currentAq.food.splice(index, 1); }
        });
        currentAq.guppies.forEach(guppy => guppy.updatePosition(currentAq));
    }
    requestAnimationFrame(renderLoop);
}
function tickLoop() {
    if (!gameState.isPaused) {
        gameState.aquariums.forEach((aq, aqIndex) => {
            // Grow and decide behavior for all guppies
            aq.guppies.forEach(guppy => {
                guppy.grow();
                guppy.decideBehavior(aq);
            });

            // Handle water degradation
            const baseAllowedGuppies = 10;
            const allowedGuppies = baseAllowedGuppies + aq.decorations.length; // Decoration effect: +1 allowed per decoration
            const extraGuppies = Math.max(0, aq.guppies.length - allowedGuppies);

            // Penalty: 10% increase in pollution speed per extra guppy
            // Base degradation is 0.1 per guppy.
            // We apply the penalty multiplier to the total degradation.
            const pollutionMultiplier = 1 + (extraGuppies * 0.1);

            // Original logic had waterQualityModifier from decorations reducing pollution.
            // The new requirement replaces this with "Decoration increases allowed count".
            // So we remove the old decoration modifier logic.

            const degradation = (aq.guppies.length * 0.1) * pollutionMultiplier;
            aq.waterQuality = Math.max(0, aq.waterQuality - degradation);

            // Handle automatic breeding
            const adults = aq.guppies.filter(g => g.stage === 'adult');
            const now = Date.now();

            for (let i = 0; i < adults.length; i++) {
                const g1 = adults[i];

                if (g1.hunger < 20 && (now - g1.lastBredTime > BREED_COOLDOWN)) {
                    for (let j = i + 1; j < adults.length; j++) {
                        const g2 = adults[j];

                        // Check gender compatibility (Male + Female)
                        if (g1.gender === g2.gender) continue;

                        if (g2.hunger < 20 && (now - g2.lastBredTime > BREED_COOLDOWN)) {
                            const distance = Math.hypot(g1.x - g2.x, g1.y - g2.y);
                            const adultWidth = 50;

                            if (distance < adultWidth) {
                                // Breeding Probability linked to Water Quality
                                // 100% Water Quality -> 100% Chance
                                // 50% Water Quality -> 50% Chance
                                // 0% Water Quality -> 0% Chance
                                const breedingChance = aq.waterQuality / 100;

                                if (Math.random() > breedingChance) {
                                    // Breeding failed due to water quality
                                    // We reset the check timer slightly so they don't spam check every tick, 
                                    // or we can just let them try again next tick. 
                                    // To prevent spamming "failed" checks, maybe we should add a small cooldown or just do nothing.
                                    // If we do nothing, they will try again next tick (1 sec later).
                                    // Let's add a small random delay to their lastBredTime to prevent immediate retry?
                                    // Or just let it be. Probability will handle it.
                                    // But if they stay close, they will try every second.
                                    // Let's just continue to next pair.
                                    continue;
                                }

                                breedGuppies(g1, g2);

                                g1.lastBredTime = now;
                                g2.lastBredTime = now;
                                g1.hunger = 50;
                                g2.hunger = 50;

                                if (aqIndex === gameState.currentAquariumIndex) {
                                    showToast(t('msg_new_fry'));
                                }
                                break;
                            }
                        }
                    }
                }
            }
        });
    }
    updateUI();
    // saveGame(); // Auto-save disabled
}

function getPatternLabel(patternType) {
    return t(`pattern_${patternType}`);
}

function openGuppyList() {
    const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
    const guppyListModal = document.createElement('div');
    guppyListModal.id = 'guppy-list-modal';
    guppyListModal.className = 'modal-overlay';
    let listContent = '';
    if (currentAq.guppies.length === 0) {
        listContent = `<p class="text-slate-400">${t('msg_empty_tank')}</p>`;
    } else {
        listContent = currentAq.guppies.map(guppy => {
            const value = calculateGuppyValue(guppy);
            const colorsHTML = guppy.pattern.colors.map((c, i) => `
                <div class="flex items-center space-x-1 text-xs">
                    <div class="w-3 h-3 rounded-full border border-slate-600" style="background-color: ${toRgbString(c)}"></div>
                    <span class="text-slate-500">R:${c.r} G:${c.g} B:${c.b}</span>
                </div>
            `).join('');

            return `
            <div class="flex items-center p-2 rounded-lg hover:bg-slate-800">
                <div class="flex-1 flex items-center cursor-pointer" onclick="showGuppyInfoById(${guppy.id})">
                    <div class="mr-4 flex-shrink-0" style="width: 80px; height: 30px;">
                        ${guppy.getGuppySVG()}
                    </div>
                    <div>
                        <p class="font-bold">ID: ${guppy.id} (${guppy.stage === 'fry' ? t('stage_fry') : t('stage_adult')}) <span class="${guppy.gender === 'male' ? 'text-blue-400' : 'text-pink-400'}">${guppy.gender === 'male' ? '♂' : '♀'}</span></p>
                        <p class="text-sm text-cyan-300 font-bold">${getPatternLabel(guppy.pattern.type)}</p>
                        <div class="mt-1 space-y-1">${colorsHTML}</div>
                    </div>
                </div>
                <button data-guppy-id="${guppy.id}" class="rehome-button ml-4 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm ${guppy.stage === 'fry' ? 'opacity-50 cursor-not-allowed' : ''}" ${guppy.stage === 'fry' ? 'disabled' : ''}>
                    ${t('info_rehome')} (${value}💰)
                </button>
            </div>`;
        }).join('');
    }

    guppyListModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-3xl font-bold mb-4 text-cyan-300">${t('modal_guppy_list_title', { index: gameState.currentAquariumIndex + 1 })}</h2>
            <div class="space-y-3">${listContent}</div>
        </div>
    `;
    modalContainer.appendChild(guppyListModal);
}

function findGuppyById(guppyId) {
    for (const aq of gameState.aquariums) {
        const guppy = aq.guppies.find(g => g.id === guppyId);
        if (guppy) return guppy;
    }
    return null;
}

function showGuppyInfoById(guppyId) {
    const guppy = findGuppyById(guppyId);
    if (guppy) {
        showGuppyInfo(guppy);
        const modal = document.getElementById('guppy-list-modal');
        if (modal) modal.remove();
    }
}
function showGuppyInfo(guppy) {
    try {
        gameState.currentInfoGuppyId = guppy.id;
        const el = (id) => document.getElementById(id);
        el('info-id').innerHTML = t('info_id', { id: guppy.id }) + ` <span class="${guppy.gender === 'male' ? 'text-blue-400' : 'text-pink-400'}">${guppy.gender === 'male' ? '♂' : '♀'}</span>`;
        const pd = el('info-pattern-details');
        const colorsHTML = guppy.pattern.colors.map(c => `
            <div class="flex items-center space-x-2 text-sm">
                <div class="w-3 h-3 rounded-full border border-slate-600" style="background-color: ${toRgbString(c)}"></div>
                <span class="text-slate-400">R:${c.r} G:${c.g} B:${c.b}</span>
            </div>
        `).join('');
        pd.innerHTML = `
            <p>${t('pattern_' + guppy.pattern.type)}</p>
            <div class="mt-1 space-y-1">${colorsHTML}</div>
        `;
        el('info-age').textContent = t('info_age', { age: guppy.age });
        el('info-stage').textContent = t('info_stage', { stage: guppy.stage === 'fry' ? t('stage_fry') : t('stage_adult') });
        el('info-hunger').textContent = t('info_hunger', { current: Math.round(guppy.hunger), max: MAX_HUNGER });
        infoMoveButton.classList.toggle('hidden', gameState.aquariums.length <= 1);
        guppyInfoPanel.classList.remove('hidden');
    } catch (e) {
        console.error('showGuppyInfo 오류:', e);
    }
}


function getPatternStyle(pattern) {
    if (pattern.colors.length > 1) {
        const c1 = toRgbString(pattern.colors[0]);
        const c2 = toRgbString(pattern.colors[1]);
        if (c1 === c2) return '';
        switch (pattern.type) {
            case 'spots': return `background: radial-gradient(${c2} 20%, transparent 25%); background-size: 15px 15px;`;
            case 'stripes': return `background: repeating-linear-gradient(45deg, ${c2}, ${c2} 5px, transparent 5px, transparent 10px);`;
            case 'h_stripes': return `background: repeating-linear-gradient(to bottom, ${c2}, ${c2} 5px, transparent 5px, transparent 10px);`;
            case 'v_stripes': return `background: repeating-linear-gradient(to right, ${c2}, ${c2} 5px, transparent 5px, transparent 10px);`;
            case 'freckles': return `background: radial-gradient(${c2} 10%, transparent 15%); background-size: 10px 10px;`;
            case 'half': return `background: linear-gradient(to right, ${c1} 50%, ${c2} 50%);`;
            case 'rings': return `background: repeating-radial-gradient(circle, ${c2}, ${c2} 3px, transparent 3px, transparent 9px);`;
            case 'checker': return `background-image: linear-gradient(45deg, ${c2} 25%, transparent 25%), linear-gradient(-45deg, ${c2} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${c2} 75%), linear-gradient(-45deg, transparent 75%, ${c2} 75%); background-size: 10px 10px;`;
            case 'gradient': return `background: radial-gradient(circle, ${c1}, ${c2});`;
        }
    }
    return '';
}

function getPatternKey(pattern) {
    const colorKey = pattern.colors.map(c => `${c.r},${c.g},${c.b}`).join('|');
    return `${pattern.type}:${colorKey}`;
}

function openShop() {
    const shopModal = document.createElement('div');
    shopModal.id = 'shop-modal';
    shopModal.className = 'modal-overlay';
    const itemsHTML = SHOP_ITEMS.map(item => {
        let itemPreview = '';
        const itemName = t(item.nameKey);
        if (item.type === 'decoration') {
            itemPreview = `<div class="flex justify-center items-center h-24">${item.svg}</div>
                <div><p class="font-bold">${itemName}</p><p class="text-sm text-slate-400">${t('shop_effect_water')}</p></div>`;
        } else if (item.type === 'guppy') {
            // Create a temp guppy to get the SVG
            const tempGuppy = new Guppy(`shop-${item.id}`, item.pattern, 0, null, 0, 0, null, null, item.gender || 'male');
            itemPreview = `<div class="flex justify-center items-center h-24">
                    <div style="width: 80px; height: 30px;">
                        ${tempGuppy.getGuppySVG()}
                    </div>
                </div>
                <div><p class="font-bold">${itemName}</p><p class="text-sm text-slate-400">${t('shop_desc_basic')}</p></div>`;
        } else if (item.type === 'aquarium') {
            itemPreview = `<div class="flex justify-center items-center h-24">
                    <svg width="60" height="60" viewBox="0 0 100 100">
                        <!-- Glass Tank -->
                        <rect x="10" y="20" width="80" height="60" rx="2" fill="#e0f7fa" stroke="#4fc3f7" stroke-width="2" fill-opacity="0.3" />
                        <!-- Water -->
                        <path d="M12 30 Q 25 25, 50 30 T 88 30 V 78 H 12 Z" fill="#4fc3f7" fill-opacity="0.5" />
                        <!-- Rim -->
                        <rect x="10" y="20" width="80" height="5" fill="#0288d1" />
                    </svg>
                </div>
                <div><p class="font-bold">${itemName}</p><p class="text-sm text-slate-400">${t('shop_desc_tank')}</p></div>`;
        }
        const price = gameState.gameMode === 'normal' && gameState.shopPrices[item.id] ? gameState.shopPrices[item.id] : item.price;
        return `<div class="border border-slate-700 rounded-lg p-2 text-center flex flex-col justify-between">
            ${itemPreview}
            <button data-item-id="${item.id}" class="buy-button mt-2 w-full btn">${price} 💰</button>
        </div>`;
    }).join('');

    shopModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-3xl font-bold mb-4 text-cyan-300">${t('shop_title')}</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">${itemsHTML}</div>
        </div>`;
    modalContainer.appendChild(shopModal);
}

function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    const price = gameState.gameMode === 'normal' && gameState.shopPrices[item.id] ? gameState.shopPrices[item.id] : item.price;

    if (gameState.coins >= price) {
        gameState.coins -= price;
        if (item.type === 'decoration') {
            const xPos = 10 + Math.random() * 80;
            const newDeco = new Decoration(item, xPos);
            gameState.aquariums[gameState.currentAquariumIndex].decorations.push(newDeco);
            newDeco.createElement();
        } else if (item.type === 'guppy') {
            const newId = gameState.nextGuppyId++;
            const newGuppy = new Guppy(newId, item.pattern, 0, null, 0, 0, null, null, item.gender || 'male');
            gameState.aquariums[gameState.currentAquariumIndex].guppies.push(newGuppy);
            newGuppy.createElement();
            const patternKey = getPatternKey(item.pattern);
            if (!gameState.discoveredPatterns.has(patternKey)) {
                gameState.discoveredPatterns.add(patternKey);
            }
            checkCollectionUnlock(newGuppy);
        } else if (item.type === 'aquarium') {
            gameState.aquariums.push({ guppies: [], decorations: [], waterQuality: 100, food: [] });
            switchAquarium(gameState.aquariums.length - 1 - gameState.currentAquariumIndex);
        }
        const modal = document.getElementById('shop-modal');
        if (modal) modal.remove();
        updateUI();
    } else {
        showToast(t('msg_coin_lack'));
    }
}

function openCollection() {
    const collectionModal = document.createElement('div');
    collectionModal.id = 'collection-modal';
    collectionModal.className = 'modal-overlay';

    const gridHTML = COLLECTION_TARGETS.map(target => {
        const isUnlocked = gameState.unlockedCollection.includes(target.id);
        const targetName = t(target.nameKey);
        const targetHint = t(target.hintKey);

        let contentHTML = '';
        if (isUnlocked) {
            // Create temp guppy for display
            const tempPattern = {
                type: target.criteria.patternType === 'any' ? 'spots' : target.criteria.patternType,
                colors: [target.criteria.bodyColor, target.criteria.patternColor]
            };
            const tempGuppy = new Guppy(`col-${target.id}`, tempPattern);

            contentHTML = `
                <div class="h-16 flex items-center justify-center mb-2">
                    <div style="width: 60px; height: 30px;">${tempGuppy.getGuppySVG()}</div>
                </div>
                <p class="font-bold text-cyan-300 text-sm">${targetName}</p>
                <p class="text-xs text-slate-400 mt-1">${targetHint}</p>
            `;
        } else {
            contentHTML = `
                <div class="h-16 flex items-center justify-center mb-2 text-4xl opacity-20">❓</div>
                <p class="font-bold text-slate-500 text-sm">${t('collection_unknown')}</p>
                <p class="text-xs text-slate-600 mt-1">${targetHint}</p>
            `;
        }

        return `
            <div class="bg-slate-800/50 border ${isUnlocked ? 'border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'border-slate-700'} rounded-lg p-2 text-center flex flex-col justify-between h-32">
                ${contentHTML}
            </div>
        `;
    }).join('');

    collectionModal.innerHTML = `
        <div class="modal-content !max-w-2xl">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-3xl font-bold mb-4 text-cyan-300">${t('collection_title')}</h2>
            <p class="mb-4 text-slate-400 text-sm">${t('collection_desc', { current: gameState.unlockedCollection.length, total: COLLECTION_TARGETS.length })}</p>
            <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto max-h-[60vh] p-1">
                ${gridHTML}
            </div>
        </div>`;
    modalContainer.appendChild(collectionModal);
}

function checkCollectionUnlock(guppy) {
    if (!guppy || !guppy.pattern || !guppy.pattern.colors) return;
    if (guppy.gender === 'female') return; // Only males are registered in the encyclopedia

    const c1 = guppy.pattern.colors[0]; // Body color
    const c2 = guppy.pattern.colors[1] || c1; // Pattern color

    COLLECTION_TARGETS.forEach(target => {
        if (gameState.unlockedCollection.includes(target.id)) return;

        // Check pattern type
        if (target.criteria.patternType !== 'any' && guppy.pattern.type !== target.criteria.patternType) return;

        // Check colors
        const isColorMatch = (c, targetC, tol) => {
            return Math.abs(c.r - targetC.r) <= tol &&
                Math.abs(c.g - targetC.g) <= tol &&
                Math.abs(c.b - targetC.b) <= tol;
        };

        const bodyMatch = isColorMatch(c1, target.criteria.bodyColor, target.criteria.tolerance);
        const patternMatch = isColorMatch(c2, target.criteria.patternColor, target.criteria.tolerance);

        if (bodyMatch && patternMatch) {
            gameState.unlockedCollection.push(target.id);
            showToast(t('msg_collection_unlock', { name: t(target.nameKey) }));
            // Bonus coins for unlocking
            gameState.coins += 100;
            showToast(t('msg_collection_bonus', { amount: 100 }));
            updateUI();
        }
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.top = '30px';
    }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.top = '20px';
        setTimeout(() => toast.remove(), 500);
    }, 2000);
}

function startBreeding(firstParent = null) {
    gameState.isPaused = true;
    gameState.isBreedingMode = true;
    gameState.breedingParents = firstParent ? [firstParent] : [];
    guppyInfoPanel.classList.add('hidden');
    updateAllGuppySelectionUI();

    if (breedButton) {
        breedButton.querySelector('span:nth-child(2)').textContent = t('breed_cancel');
        breedButton.classList.add('text-red-400');
    }

    if (firstParent) {
        showToast(t('msg_breed_start_1'));
    } else {
        showToast(t('msg_breed_start_first'));
    }
}

function selectBreedingGuppy(guppy) {
    if (guppy.stage !== 'adult') {
        showToast(t('msg_breed_only_adult'));
        return;
    }
    if (gameState.breedingParents.length > 0 && gameState.breedingParents[0].id === guppy.id) return;

    if (gameState.breedingParents.length === 1) {
        const p1 = gameState.breedingParents[0];
        if (p1.gender === guppy.gender) {
            showToast(t('msg_breed_same_gender'));
            return;
        }
    }

    gameState.breedingParents.push(guppy);
    updateAllGuppySelectionUI();

    if (gameState.breedingParents.length === 2) {
        openBreedModal();
        gameState.isBreedingMode = false;
    } else {
        showToast(t('msg_breed_start_1'));
    }
}

function cancelBreeding() {
    gameState.isPaused = false;
    gameState.isBreedingMode = false;
    gameState.breedingParents = [];
    updateAllGuppySelectionUI();

    if (breedButton) {
        breedButton.querySelector('span:nth-child(2)').textContent = t('breed_button');
        breedButton.classList.remove('text-red-400');
    }
}

function updateAllGuppySelectionUI() {
    gameState.aquariums[gameState.currentAquariumIndex].guppies.forEach(g => {
        if (g.element) {
            const isSelected = gameState.breedingParents.some(p => p.id === g.id);
            g.element.classList.toggle('selected', isSelected);
        }
    });
}

function openBreedModal() {
    const [p1, p2] = gameState.breedingParents;
    const breedModal = document.createElement('div');
    breedModal.id = 'breed-modal';
    breedModal.className = 'modal-overlay';
    const breedCostText = gameState.gameMode === 'normal' ? ' (500💰)' : '';
    breedModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-3xl font-bold mb-4 text-cyan-300">${t('modal_breed_lab')}</h2>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center p-2 border border-slate-700 rounded-lg">${getGuppyCardHTML(p1)}</div>
                <div class="text-center p-2 border border-slate-700 rounded-lg">${getGuppyCardHTML(p2)}</div>
            </div>
            <div id="breed-action-container" class="text-center mb-4">
                <button id="final-breed-button" class="btn btn-primary font-bold py-2 px-8 rounded-lg">${t('modal_breed_exec')}${breedCostText}</button>
            </div>
            <div id="breed-result-container" class="hidden">
                <h3 class="text-xl font-semibold mt-6 mb-2 text-cyan-400">${t('modal_breed_result')}</h3>
                <div id="breed-result-guppy" class="flex justify-center items-center p-2 border border-slate-700 rounded-lg"></div>
                <h4 class="text-lg font-semibold mt-4 mb-2 text-cyan-400">${t('modal_breed_report')}</h4>
                <div id="breed-report" class="text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-1"></div>
                <div class="text-center mt-4">
                    <button id="breed-result-close-button" class="btn w-1/2">${t('modal_breed_close')}</button>
                </div>
            </div>
        </div>
    `;
    modalContainer.appendChild(breedModal);

    breedModal.querySelector('#final-breed-button').addEventListener('click', () => {
        if (gameState.gameMode === 'normal') {
            if (gameState.coins < 500) {
                showToast(t('msg_breed_cost_lack', { cost: 500 }));
                return;
            }
            gameState.coins -= 500;
            showToast(t('msg_breed_cost_paid', { cost: 500 }));
            updateUI();
        }

        const { newGuppy, inheritance } = breedGuppies(p1, p2);
        breedModal.querySelector('#breed-result-guppy').innerHTML = getGuppyCardHTML(newGuppy);

        let reportHTML = `<p>${t('pattern_inherit', { pattern: getPatternLabel(newGuppy.pattern.type), parent: inheritance.pattern })}</p>`;
        newGuppy.pattern.colors.forEach((childColor, i) => {
            const colorLabel = i === 0 ? t('color_body') : t('color_pattern', { index: i });
            const inheritanceInfo = inheritance.colors[i];
            const parentNum = inheritanceInfo.from;
            const parentColor = parentNum === 1
                ? (p1.pattern.colors[i] || p1.pattern.colors[0])
                : (p2.pattern.colors[i] || p2.pattern.colors[0]);

            reportHTML += `
                <div class="p-2 my-1 bg-slate-800 rounded">
                    <p class="font-semibold">${colorLabel}: 
                        <span class="inline-flex items-center space-x-1">
                            <span class="w-3 h-3 rounded-full border border-slate-600" style="background-color: ${toRgbString(childColor)}"></span>
                            <span>R:${childColor.r} G:${childColor.g} B:${childColor.b}</span>
                        </span>
                    </p>
                    <p class="text-xs text-slate-400 pl-4">${t('color_mutation', { parent: parentNum, r: parentColor.r, g: parentColor.g, b: parentColor.b })}</p>
                </div>
            `;
        });
        breedModal.querySelector('#breed-report').innerHTML = reportHTML;

        breedModal.querySelector('#breed-action-container').classList.add('hidden');
        breedModal.querySelector('#breed-result-container').classList.remove('hidden');
        cancelBreeding();
    });
    breedModal.querySelector('#breed-result-close-button').addEventListener('click', () => {
        if (gameState.isPaused) cancelBreeding();
        breedModal.remove();
    });
}

function getGuppyCardHTML(guppy) {
    const colorsHTML = guppy.pattern.colors.map(c => `
        <div class="flex items-center space-x-1 text-xs">
            <div class="w-3 h-3 rounded-full border border-slate-600" style="background-color: ${toRgbString(c)}"></div>
            <span class="text-slate-500">R:${c.r} G:${c.g} B:${c.b}</span>
        </div>
    `).join('');

    let html = `
        <div class="flex justify-center mb-4">
            <div style="width: 120px; height: 60px;">
                ${guppy.getGuppySVG()}
            </div>
        </div>
        <p class="font-bold">ID: ${guppy.id || 'New'} <span class="${guppy.gender === 'male' ? 'text-blue-400' : 'text-pink-400'}">${guppy.gender === 'male' ? '♂' : '♀'}</span></p>
        <p class="text-sm text-cyan-300 font-bold">${getPatternLabel(guppy.pattern.type)}</p>
        <div class="mt-1 space-y-1 text-left inline-block">${colorsHTML}</div>
    `;
    return html;
}

function renderCurrentAquarium() {
    // Clear everything except bubbles
    const bubbles = aquarium.querySelectorAll('.bubble');
    aquarium.innerHTML = '';
    bubbles.forEach(b => aquarium.appendChild(b));

    const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
    currentAq.guppies.forEach(g => g.createElement());
    currentAq.decorations.forEach(d => d.createElement());
    currentAq.food.forEach(f => f.createElement());
    updateUI();
}

function switchAquarium(direction) {
    const newIndex = gameState.currentAquariumIndex + direction;
    if (newIndex >= 0 && newIndex < gameState.aquariums.length) {
        gameState.currentAquariumIndex = newIndex;
        renderCurrentAquarium();
    }
}

function updateAquariumNav() {
    prevAquariumButton.classList.toggle('hidden', gameState.currentAquariumIndex === 0);
    nextAquariumButton.classList.toggle('hidden', gameState.currentAquariumIndex === gameState.aquariums.length - 1);
}

function openMoveGuppyModal() {
    const guppy = findGuppyById(gameState.currentInfoGuppyId);
    if (!guppy) return;

    const moveModal = document.createElement('div');
    moveModal.id = 'move-guppy-modal';
    moveModal.className = 'modal-overlay';

    let optionsHTML = '';
    gameState.aquariums.forEach((aq, index) => {
        if (index !== gameState.currentAquariumIndex) {
            optionsHTML += `<button class="move-to-aq-button btn w-full" data-target-index="${index}">${t('modal_move_btn', { index: index + 1 })}</button>`;
        }
    });

    moveModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-2xl font-bold mb-4 text-cyan-300">${t('modal_move_title')}</h2>
            <div class="space-y-2">${optionsHTML}</div>
        </div>
    `;
    modalContainer.appendChild(moveModal);
}

// --- 이벤트 리스너 ---


function openModal(type) {
    const modal = document.createElement('div');
    modal.id = `${type}-modal`;
    modal.className = 'modal-overlay';
    let content = '';
    switch (type) {
        case 'manual':
            content = `
                <h2 class="text-3xl font-bold mb-4 text-cyan-300">${t('manual_title')}</h2>
                <p class="text-slate-300">${t('manual_intro')}</p>
                <h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-400">${t('manual_mode_title')}</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-300">
                    <li>${t('manual_mode_dev')}</li>
                    <li>${t('manual_mode_normal')}</li>
                </ul>
                <h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-400">${t('manual_manage_title')}</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-300">
                    <li>${t('manual_manage_feed')}</li>
                    <li>${t('manual_manage_clean')}</li>
                    <li>${t('manual_manage_grow')}</li>
                </ul>
                <h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-400">${t('manual_breed_title')}</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-300">
                    <li>${t('manual_breed_manual')}</li>
                    <li>${t('manual_breed_auto')}</li>
                </ul>
                <h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-400">${t('manual_tips_title')}</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-300">
                    <li>${t('manual_tips_tank')}</li>
                    <li>${t('manual_tips_info')}</li>
                    <li>${t('manual_tips_coin')}</li>
                    <li>${t('manual_tips_save')}</li>
                </ul>`;
            break;
    }
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            ${content}
        </div>`;
    modalContainer.appendChild(modal);
}

function createDefaultGuppies() {
    const p1 = { type: 'spots', colors: [{ r: 255, g: 255, b: 255 }, { r: 255, g: 0, b: 0 }] };
    const p2 = { type: 'stripes', colors: [{ r: 20, g: 20, b: 255 }, { r: 255, g: 255, b: 0 }] };
    const guppy1 = new Guppy(gameState.nextGuppyId++, p1, 0, null, 0, 0, null, null, 'male');
    const guppy2 = new Guppy(gameState.nextGuppyId++, p2, 0, null, 0, 0, null, null, 'female');
    gameState.aquariums[0].guppies.push(guppy1, guppy2);
    gameState.discoveredPatterns.add(getPatternKey(p1));
    gameState.discoveredPatterns.add(getPatternKey(p2));
}

function init() {
    for (let i = 0; i < 10; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDuration = `${Math.random() * 3 + 4}s`;
        bubble.style.animationDelay = `${Math.random() * 4}s`;
        aquarium.appendChild(bubble);
    }

    renderCurrentAquarium();
    setInterval(tickLoop, 1000);
    requestAnimationFrame(renderLoop);
}

function startNewGame(mode = 'developer') {
    // Reset game state to default
    gameState = {
        aquariums: [{ guppies: [], decorations: [], waterQuality: 100, food: [] }],
        currentAquariumIndex: 0,
        nextGuppyId: 0,
        coins: 100,
        discoveredPatterns: new Set(),
        isBreedingMode: false,
        breedingParents: [],
        currentInfoGuppyId: null,
        isPaused: false,
        unlockedCollection: [],
        gameMode: mode,
        shopPrices: {},
    };

    if (mode === 'normal') {
        // Randomize Shop Prices
        SHOP_ITEMS.forEach(item => {
            const randomPrice = Math.floor(Math.random() * (10000 - 500 + 1)) + 500;
            gameState.shopPrices[item.id] = Math.round(randomPrice / 100) * 100;
        });

        // Create initial cheapest pair
        let cheapestItem = null;
        let minPrice = Infinity;

        SHOP_ITEMS.filter(i => i.type === 'guppy' && i.gender === 'male').forEach(item => {
            const price = gameState.shopPrices[item.id];
            if (price < minPrice) {
                minPrice = price;
                cheapestItem = item;
            }
        });

        if (cheapestItem) {
            const male = new Guppy(gameState.nextGuppyId++, cheapestItem.pattern, 0, null, 0, 0, null, null, 'male');
            gameState.aquariums[0].guppies.push(male);
            male.createElement();

            // Find female version or reuse pattern
            // Assuming female ID is usually male ID + '_f' or just same pattern
            const female = new Guppy(gameState.nextGuppyId++, cheapestItem.pattern, 0, null, 0, 0, null, null, 'female');
            gameState.aquariums[0].guppies.push(female);
            female.createElement();
        }
    } else {
        createDefaultGuppies();
    }

    gameInitialized = true;
    init();
    showGameScreen();
    showToast(mode === 'developer' ? t('msg_start_dev') : t('msg_start_normal'));
}

function showGameScreen() {
    console.log("Guppy Lab: Showing game screen...");
    if (introWrapper && mainAppScreen) {
        introWrapper.classList.add('hidden');
        mainAppScreen.classList.remove('hidden');
        mainAppScreen.style.display = 'flex';
    } else {
        console.error("Guppy Lab: Critical elements missing for game screen", { introWrapper, mainAppScreen });
    }
}

function setupEventListeners() {
    console.log("Guppy Lab: Setting up event listeners");

    // --- Main UI Buttons ---
    if (manualButton) manualButton.addEventListener('click', () => openModal('manual'));
    if (guppyListButton) guppyListButton.addEventListener('click', openGuppyList);
    if (shopButton) shopButton.addEventListener('click', openShop);
    if (collectionButton) collectionButton.addEventListener('click', openCollection);

    if (feedButton) feedButton.addEventListener('click', () => {
        if (gameState.coins >= FEED_COST) {
            gameState.coins -= FEED_COST;
            updateUI();
            // Scatter food
            const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * (aquarium.clientWidth - 10);
                const y = Math.random() * 20;
                currentAq.food.push(new Food(x, y));
            }
        } else {
            showToast(t('msg_coin_lack'));
        }
    });

    if (cleanButton) cleanButton.addEventListener('click', () => {
        gameState.aquariums[gameState.currentAquariumIndex].waterQuality = 100;
        updateUI();
        showToast(t('msg_water_clean'));
    });

    if (breedButton) breedButton.addEventListener('click', () => {
        if (gameState.isBreedingMode) {
            cancelBreeding();
        } else {
            startBreeding();
        }
    });

    // --- Navigation ---
    if (prevAquariumButton) prevAquariumButton.addEventListener('click', () => switchAquarium(-1));
    if (nextAquariumButton) nextAquariumButton.addEventListener('click', () => switchAquarium(1));

    // --- Info Panel ---
    if (closeInfoPanelButton) closeInfoPanelButton.addEventListener('click', () => {
        guppyInfoPanel.classList.add('hidden');
    });

    if (infoBreedButton) infoBreedButton.addEventListener('click', () => {
        const guppy = findGuppyById(gameState.currentInfoGuppyId);
        if (guppy) {
            // If we are already in breeding mode, just select this one
            if (!gameState.isBreedingMode) {
                startBreeding(guppy);
            } else {
                selectBreedingGuppy(guppy);
            }
            guppyInfoPanel.classList.add('hidden');
        }
    });

    if (infoRehomeButton) infoRehomeButton.addEventListener('click', () => {
        rehomeGuppy(gameState.currentInfoGuppyId);
        guppyInfoPanel.classList.add('hidden');
    });

    if (infoMoveButton) infoMoveButton.addEventListener('click', openMoveGuppyModal);

    // --- Global Click Delegation ---
    document.body.addEventListener('click', (e) => {
        // Rehome button in list
        if (e.target.classList.contains('rehome-button')) {
            const guppyId = parseInt(e.target.dataset.guppyId);
            rehomeGuppy(guppyId);
        }

        // Close info panel when clicking outside
        if (!e.target.closest('.guppy') &&
            !e.target.closest('#guppy-info-panel') &&
            !e.target.closest('#guppy-list-modal') &&
            !e.target.closest('.modal-overlay')) { // Added modal overlay check to prevent closing when clicking modals
            guppyInfoPanel.classList.add('hidden');
        }

        // Cancel breeding if clicking on background
        if (e.target.id === 'aquarium') {
            if (gameState.isBreedingMode) {
                cancelBreeding();
                showToast(t('msg_breed_cancel'));
            }
        }

        // Close modals
        if (e.target.classList.contains('close-modal-button') || e.target.classList.contains('modal-overlay')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                if (modal.id === 'breed-modal') cancelBreeding();
                modal.remove();
            }
        }

        // Buy items
        if (e.target.classList.contains('buy-button')) {
            buyItem(e.target.dataset.itemId);
        }

        // Move guppy to another aquarium
        if (e.target.classList.contains('move-to-aq-button')) {
            const targetIndex = parseInt(e.target.dataset.targetIndex);
            const guppyToMove = findGuppyById(gameState.currentInfoGuppyId);
            const sourceAq = gameState.aquariums[gameState.currentAquariumIndex];

            if (guppyToMove) {
                const guppyIndex = sourceAq.guppies.findIndex(g => g.id === guppyToMove.id);
                if (guppyIndex > -1) {
                    sourceAq.guppies.splice(guppyIndex, 1);

                    // Safe destroy
                    if (typeof guppyToMove.destroy === 'function') {
                        guppyToMove.destroy();
                    } else {
                        // Fallback manual removal
                        if (guppyToMove.element) guppyToMove.element.remove();
                        const selector = `.guppy[data-id="${guppyToMove.id}"]`;
                        const el = document.querySelector(selector);
                        if (el) el.remove();
                    }

                    // Add to target aquarium
                    // IMPORTANT: We must ensure it's an instance when adding to new aquarium, 
                    // although loadGame usually handles this, pushing a plain object might cause issues later if not re-instantiated.
                    // For now, pushing the object is fine as long as we don't expect it to have methods immediately without reload/re-render.
                    // Ideally, we should re-instantiate it if it's a plain object.
                    let guppyInstance = guppyToMove;
                    if (!(guppyToMove instanceof Guppy)) {
                        guppyInstance = new Guppy(guppyToMove.id, guppyToMove.pattern, guppyToMove.age, guppyToMove.parents, guppyToMove.hunger, guppyToMove.lastBredTime, guppyToMove.x, guppyToMove.y);
                    }
                    // Reset element reference for the new aquarium (it will be created when rendered)
                    guppyInstance.element = null;

                    gameState.aquariums[targetIndex].guppies.push(guppyInstance);

                    guppyInfoPanel.classList.add('hidden');
                    const modal = e.target.closest('.modal-overlay');
                    if (modal) modal.remove();

                    showToast(t('msg_move_success', { target: targetIndex + 1 }));
                    updateUI(); // Update counts etc
                }
            }
        }
    });
}
