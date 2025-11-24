// --- DOM 요소 ---
const introWrapper = document.getElementById('intro-wrapper');
const mainAppScreen = document.getElementById('main-app-screen');
const startButton = document.getElementById('start-button');
const aquarium = document.getElementById('aquarium');
const coinsDisplay = document.getElementById('coins-display');
const waterQualityBar = document.getElementById('water-quality-bar');
const feedButton = document.getElementById('feed-button');
const cleanButton = document.getElementById('clean-button');
const breedButton = document.getElementById('breed-button');
const guppyInfoPanel = document.getElementById('guppy-info-panel');
const closeInfoPanelButton = document.getElementById('close-info-panel');
const infoBreedButton = document.getElementById('info-breed-button');
const infoRehomeButton = document.getElementById('info-rehome-button');
const infoMoveButton = document.getElementById('info-move-button');
const manualButton = document.getElementById('manual-button');
const guppyListButton = document.getElementById('guppy-list-button');
const shopButton = document.getElementById('shop-button');
const collectionButton = document.getElementById('collection-button');
const modalContainer = document.getElementById('modal-container');
const prevAquariumButton = document.getElementById('prev-aquarium');
const nextAquariumButton = document.getElementById('next-aquarium');
const aquariumTitle = document.getElementById('aquarium-title');

// --- 게임 설정 및 데이터 ---
const ADULT_AGE = 20;
const MAX_HUNGER = 100;
const HUNGRY_THRESHOLD = 70;
const FEED_COST = 10;
const BREED_COOLDOWN = 20000; // 20 seconds
const PATTERN_TYPES = ['spots', 'stripes', 'h_stripes', 'v_stripes', 'freckles', 'half', 'rings', 'checker', 'gradient'];
const SHOP_ITEMS = [
    { id: 'plant1', type: 'decoration', name: '네온 수초', price: 50, effect: { waterQuality: 0.02 }, svg: `<svg width="50" height="100" viewBox="0 0 50 100"><path d="M25 100 C 10 80, 40 60, 25 40 S 10 20, 25 0" stroke="cyan" stroke-width="4" fill="none" /></svg>` },
    { id: 'guppy_red', type: 'guppy', name: '빨강 점박이 구피', price: 100, pattern: { type: 'spots', colors: [{ r: 255, g: 20, b: 20 }, { r: 255, g: 20, b: 20 }] } },
    { id: 'guppy_blue', type: 'guppy', name: '파랑 줄무늬 구피', price: 120, pattern: { type: 'stripes', colors: [{ r: 20, g: 20, b: 255 }, { r: 20, g: 20, b: 255 }] } },
    { id: 'aquarium_new', type: 'aquarium', name: '새로운 수조', price: 500 },
];

let gameState = {
    aquariums: [{ guppies: [], decorations: [], waterQuality: 100, food: [] }],
    currentAquariumIndex: 0,
    nextGuppyId: 0,
    coins: 100,
    discoveredPatterns: new Set(),
    isBreedingMode: false,
    breedingParents: [],
    currentInfoGuppyId: null,
    isPaused: false,
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
    constructor(id, pattern, age = 0, parents = null, hunger = 0, lastBredTime = 0) {
        this.id = id; this.pattern = pattern; this.age = age; this.parents = parents; this.hunger = hunger;
        this.lastBredTime = lastBredTime;
        this.stage = this.age >= ADULT_AGE ? 'adult' : 'fry';
        this.x = Math.random() * (aquarium.clientWidth - 50);
        this.y = Math.random() * (aquarium.clientHeight - 25);
        this.target = null; this.speed = 1 + Math.random() * 1.5; this.isFlipped = false;
        this.nibbleTargetX = null;
        this.element = null; // Element is created when rendered in an aquarium
    }
    createElement() {
        const guppyEl = document.createElement('div');
        guppyEl.className = 'guppy'; guppyEl.dataset.id = this.id;
        guppyEl.style.left = `${this.x}px`; guppyEl.style.top = `${this.y}px`;
        const patternOverlay = document.createElement('div');
        patternOverlay.className = 'pattern-overlay'; guppyEl.appendChild(patternOverlay);
        const tail = document.createElement('div');
        tail.className = 'guppy-tail'; guppyEl.appendChild(tail);
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
    }
    updateAppearance() {
        if (!this.element) return;
        this.element.classList.toggle('fry', this.stage === 'fry');
        this.element.classList.toggle('adult', this.stage === 'adult');
        const baseColor = toRgbString(this.pattern.colors[0]);
        this.element.style.backgroundColor = baseColor;
        const patternOverlay = this.element.querySelector('.pattern-overlay');
        patternOverlay.style.cssText = getPatternStyle(this.pattern);

        const tail = this.element.querySelector('.guppy-tail');
        const tailColor = toRgbString({ r: Math.max(0, this.pattern.colors[0].r - 30), g: Math.max(0, this.pattern.colors[0].g - 30), b: Math.max(0, this.pattern.colors[0].b - 30) });
        tail.style.borderLeftColor = tailColor;
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
                this.nibbleTargetX = Math.random() * (aquarium.clientWidth - guppyWidth);
            }
            this.target = { x: this.nibbleTargetX, y: 10 }; return;
        }

        this.nibbleTargetX = null;
        if (!this.target || (this.target && !aquariumState.food.includes(this.target))) {
            this.target = { x: Math.random() * (aquarium.clientWidth - 50), y: Math.random() * (aquarium.clientHeight - 25) };
        }
    }
    updatePosition(aquariumState) {
        if (!this.target || !this.element) return;
        const dx = this.target.x - this.x; const dy = this.target.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (this.hunger > HUNGRY_THRESHOLD && aquariumState.food.length === 0 && this.y < 30) {
            this.element.classList.add('nibbling');
            this.element.classList.toggle('flipped', this.isFlipped);
        } else {
            this.element.classList.remove('nibbling', 'flipped');
        }

        if (distance < this.speed) {
            if (this.target.constructor.name === 'Food') {
                this.hunger = Math.max(0, this.hunger - 50); this.target.destroy();
                aquariumState.food = aquariumState.food.filter(f => f !== this.target);
            }
            this.target = null; return;
        }
        const oldX = this.x;
        this.x += (dx / distance) * this.speed; this.y += (dy / distance) * this.speed;
        if (this.x !== oldX) {
            this.isFlipped = this.x < oldX;
            this.element.style.transform = this.isFlipped ? 'scaleX(-1)' : 'scaleX(1)';
        }
        this.element.style.left = `${this.x}px`; this.element.style.top = `${this.y}px`;
    }
    destroy() { if (this.element) this.element.remove(); this.element = null; }
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
    destroy() { if (this.element) this.element.remove(); this.element = null; }
}

function getPatternKey(pattern) {
    const roundValue = (v) => Math.min(255, Math.round(v / 20) * 20);
    return `${pattern.type}-${pattern.colors.map(c => `${roundValue(c.r)},${roundValue(c.g)},${roundValue(c.b)}`).join('-')}`;
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
    if (!gameState.discoveredPatterns.has(patternKey)) {
        gameState.discoveredPatterns.add(patternKey);
        gameState.coins += 50;
        showToast('+50 코인! (새로운 조합)');
    }
    const newId = gameState.nextGuppyId++;
    const newGuppy = new Guppy(newId, newPattern);

    newGuppy.x = (parent1.x + parent2.x) / 2;
    newGuppy.y = (parent1.y + parent2.y) / 2;

    gameState.aquariums[gameState.currentAquariumIndex].guppies.push(newGuppy);
    newGuppy.createElement();

    return { newGuppy, inheritance };
}
function calculateGuppyValue(guppy) {
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
        showToast('치어는 분양 보낼 수 없습니다.');
        return;
    }
    showConfirmation(`${value} 코인을 받고 이 구피를 분양 보내시겠습니까?`, () => {
        gameState.coins += value;
        guppy.destroy();
        currentAq.guppies.splice(guppyIndex, 1);
        gameState.breedingParents = gameState.breedingParents.filter(p => p.id !== guppyId);
        updateUI();
        const modal = document.getElementById('guppy-list-modal');
        if (modal) {
            modal.remove();
            openGuppyList(); // Refresh the list
        }
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
                <button id="confirm-yes-button" class="btn btn-primary py-2 px-8 rounded-lg">예</button>
                <button id="confirm-no-button" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg">아니오</button>
            </div>
        </div>`;
    modalContainer.appendChild(confirmModal);

    const yesHandler = () => {
        onConfirm();
        modalContainer.removeChild(confirmModal);
    };
    const noHandler = () => {
        modalContainer.removeChild(confirmModal);
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
    const plainState = JSON.parse(JSON.stringify(gameState));
    plainState.aquariums.forEach(aq => {
        aq.guppies.forEach(g => {
            delete g.element; // Don't save DOM elements
            delete g.target;
        });
        aq.decorations.forEach(d => delete d.element);
        aq.food = [];
    });
    plainState.discoveredPatterns = Array.from(plainState.discoveredPatterns);
    localStorage.setItem('guppyLabSave', JSON.stringify(plainState));
}
function loadGame() {
    const savedData = localStorage.getItem('guppyLabSave');
    if (savedData) {
        const loadedState = JSON.parse(savedData);
        gameState = { ...gameState, ...loadedState };
        gameState.discoveredPatterns = new Set(loadedState.discoveredPatterns);

        gameState.aquariums.forEach(aqData => {
            const guppies = aqData.guppies.map(gData => new Guppy(gData.id, gData.pattern, gData.age, gData.parents, gData.hunger, gData.lastBredTime || 0));
            const decorations = aqData.decorations.map(dData => {
                const item = SHOP_ITEMS.find(i => i.id === dData.item.id);
                return new Decoration(item, dData.x);
            });
            aqData.guppies = guppies;
            aqData.decorations = decorations;
            aqData.food = [];
        });
        return true;
    }
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
            let waterQualityModifier = 1;
            aq.decorations.forEach(deco => {
                if (deco.item.effect && deco.item.effect.waterQuality) {
                    waterQualityModifier -= deco.item.effect.waterQuality;
                }
            });
            const degradation = aq.guppies.length * 0.1 * waterQualityModifier;
            aq.waterQuality = Math.max(0, aq.waterQuality - degradation);

            // Handle automatic breeding
            const adults = aq.guppies.filter(g => g.stage === 'adult');
            const now = Date.now();

            for (let i = 0; i < adults.length; i++) {
                const g1 = adults[i];

                if (g1.hunger < 20 && (now - g1.lastBredTime > BREED_COOLDOWN)) {
                    for (let j = i + 1; j < adults.length; j++) {
                        const g2 = adults[j];

                        if (g2.hunger < 20 && (now - g2.lastBredTime > BREED_COOLDOWN)) {
                            const distance = Math.hypot(g1.x - g2.x, g1.y - g2.y);
                            const adultWidth = 50;

                            if (distance < adultWidth) {
                                breedGuppies(g1, g2);

                                g1.lastBredTime = now;
                                g2.lastBredTime = now;
                                g1.hunger = 50;
                                g2.hunger = 50;

                                if (aqIndex === gameState.currentAquariumIndex) {
                                    showToast('새로운 치어가 태어났습니다!');
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
    saveGame();
}

function openGuppyList() {
    const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
    const guppyListModal = document.createElement('div');
    guppyListModal.id = 'guppy-list-modal';
    guppyListModal.className = 'modal-overlay';
    let listContent = '';
    if (currentAq.guppies.length === 0) {
        listContent = '<p class="text-slate-400">이 수조에는 구피가 없습니다.</p>';
    } else {
        listContent = currentAq.guppies.map(guppy => {
            const value = calculateGuppyValue(guppy);
            const colorsHTML = guppy.pattern.colors.map(c => `
                <div class="flex items-center space-x-1 text-xs">
                    <div class="w-3 h-3 rounded-full border border-slate-600" style="background-color: ${toRgbString(c)}"></div>
                    <span class="text-slate-500">R:${c.r} G:${c.g} B:${c.b}</span>
                </div>
            `).join('');

            return `
            <div class="flex items-center p-2 rounded-lg hover:bg-slate-800">
                <div class="flex-1 flex items-center cursor-pointer" onclick="showGuppyInfoById(${guppy.id})">
                    <div class="static-guppy-container mr-4">
                        <div class="static-guppy" style="background-color: ${toRgbString(guppy.pattern.colors[0])};">
                            <div class="pattern-overlay" style="${getPatternStyle(guppy.pattern)}"></div>
                            <div class="static-guppy-tail" style="border-left-color: ${toRgbString({ r: Math.max(0, guppy.pattern.colors[0].r - 30), g: Math.max(0, guppy.pattern.colors[0].g - 30), b: Math.max(0, guppy.pattern.colors[0].b - 30) })};"></div>
                        </div>
                    </div>
                    <div>
                        <p class="font-bold">ID: ${guppy.id} (${guppy.stage === 'fry' ? '치어' : '성어'})</p>
                        <p class="text-sm text-slate-400">패턴: ${guppy.pattern.type}</p>
                        <div class="mt-1 space-y-1">${colorsHTML}</div>
                    </div>
                </div>
                <button data-guppy-id="${guppy.id}" class="rehome-button ml-4 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm ${guppy.stage === 'fry' ? 'opacity-50 cursor-not-allowed' : ''}" ${guppy.stage === 'fry' ? 'disabled' : ''}>
                    분양 (${value}💰)
                </button>
            </div>`;
        }).join('');
    }

    guppyListModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-3xl font-bold mb-4 text-cyan-300">내 구피 목록 (수조 ${gameState.currentAquariumIndex + 1})</h2>
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
        el('info-id').textContent = `ID: ${guppy.id}`;
        const pd = el('info-pattern-details');
        const colorsHTML = guppy.pattern.colors.map(c => `
            <div class="flex items-center space-x-2 text-sm">
                <div class="w-3 h-3 rounded-full border border-slate-600" style="background-color: ${toRgbString(c)}"></div>
                <span class="text-slate-400">R:${c.r} G:${c.g} B:${c.b}</span>
            </div>
        `).join('');
        pd.innerHTML = `
            <p>패턴: ${guppy.pattern.type}</p>
            <div class="mt-1 space-y-1">${colorsHTML}</div>
        `;
        el('info-age').textContent = `나이: ${guppy.age}초`;
        el('info-stage').textContent = `단계: ${guppy.stage === 'fry' ? '치어' : '성어'}`;
        el('info-hunger').textContent = `허기: ${guppy.hunger} / ${MAX_HUNGER}`;
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

function openShop() {
    const shopModal = document.createElement('div');
    shopModal.id = 'shop-modal';
    shopModal.className = 'modal-overlay';
    const itemsHTML = SHOP_ITEMS.map(item => {
        let itemPreview = '';
        if (item.type === 'decoration') {
            itemPreview = `<div class="flex justify-center items-center h-24">${item.svg}</div>
                <div><p class="font-bold">${item.name}</p><p class="text-sm text-slate-400">효과: 수질 정화</p></div>`;
        } else if (item.type === 'guppy') {
            itemPreview = `<div class="flex justify-center items-center h-24">
                    <div class="static-guppy-container">
                        <div class="static-guppy" style="background-color: ${toRgbString(item.pattern.colors[0])};">
                            <div class="pattern-overlay" style="${getPatternStyle(item.pattern)}"></div>
                            <div class="static-guppy-tail" style="border-left-color: ${toRgbString({ r: Math.max(0, item.pattern.colors[0].r - 30), g: Math.max(0, item.pattern.colors[0].g - 30), b: Math.max(0, item.pattern.colors[0].b - 30) })};"></div>
                        </div>
                    </div>
                </div>
                <div><p class="font-bold">${item.name}</p><p class="text-sm text-slate-400">기본 혈통</p></div>`;
        } else if (item.type === 'aquarium') {
            itemPreview = `<div class="flex justify-center items-center h-24 text-6xl">🐠</div>
                <div><p class="font-bold">${item.name}</p><p class="text-sm text-slate-400">구피를 더 키워보세요</p></div>`;
        }
        return `<div class="border border-slate-700 rounded-lg p-2 text-center flex flex-col justify-between">
            ${itemPreview}
            <button data-item-id="${item.id}" class="buy-button mt-2 w-full btn">${item.price} 💰</button>
        </div>`;
    }).join('');

    shopModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-3xl font-bold mb-4 text-cyan-300">상점 🛍️</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">${itemsHTML}</div>
        </div>`;
    modalContainer.appendChild(shopModal);
}

function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (gameState.coins >= item.price) {
        gameState.coins -= item.price;
        if (item.type === 'decoration') {
            const xPos = 10 + Math.random() * 80;
            const newDeco = new Decoration(item, xPos);
            gameState.aquariums[gameState.currentAquariumIndex].decorations.push(newDeco);
            newDeco.createElement();
        } else if (item.type === 'guppy') {
            const newId = gameState.nextGuppyId++;
            const newGuppy = new Guppy(newId, item.pattern);
            gameState.aquariums[gameState.currentAquariumIndex].guppies.push(newGuppy);
            newGuppy.createElement();
            const patternKey = getPatternKey(item.pattern);
            if (!gameState.discoveredPatterns.has(patternKey)) {
                gameState.discoveredPatterns.add(patternKey);
            }
        } else if (item.type === 'aquarium') {
            gameState.aquariums.push({ guppies: [], decorations: [], waterQuality: 100, food: [] });
            switchAquarium(gameState.aquariums.length - 1 - gameState.currentAquariumIndex);
        }
        const modal = document.getElementById('shop-modal');
        if (modal) modal.remove();
        updateUI();
    } else {
        showToast('코인이 부족합니다!');
    }
}

function openCollection() {
    const collectionModal = document.createElement('div');
    collectionModal.id = 'collection-modal';
    collectionModal.className = 'modal-overlay';

    let collectionHTML = '';
    gameState.discoveredPatterns.forEach(patternKey => {
        const [type, ...colorsStr] = patternKey.split('-');
        const colors = colorsStr.map(cs => {
            const [r, g, b] = cs.split(',');
            return { r: parseInt(r), g: parseInt(g), b: parseInt(b) };
        });
        const pattern = { type, colors };
        const colorsHTML = pattern.colors.map(c => `
            <div class="flex items-center space-x-2">
                <div class="w-4 h-4 rounded-full border border-slate-600" style="background-color: ${toRgbString(c)}"></div>
                <p class="text-xs text-slate-400">R:${c.r} G:${c.g} B:${c.b}</p>
            </div>`).join('');

        collectionHTML += `
            <div class="flex items-center p-2 rounded-lg border border-slate-700">
                <div class="static-guppy-container mr-4">
                    <div class="static-guppy" style="background-color: ${toRgbString(pattern.colors[0])};">
                        <div class="pattern-overlay" style="${getPatternStyle(pattern)}"></div>
                        <div class="static-guppy-tail" style="border-left-color: ${toRgbString({ r: Math.max(0, pattern.colors[0].r - 30), g: Math.max(0, pattern.colors[0].g - 30), b: Math.max(0, pattern.colors[0].b - 30) })};"></div>
                    </div>
                </div>
                <div>
                    <p class="font-bold capitalize">${pattern.type}</p>
                    <div class="flex flex-col space-y-1 mt-1">${colorsHTML}</div>
                </div>
            </div>`;
    });

    collectionModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-3xl font-bold mb-4 text-cyan-300">도감 📖</h2>
            <p class="mb-4 text-slate-400">지금까지 발견한 구피들입니다. ${gameState.discoveredPatterns.size} / ?</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${collectionHTML}</div>
        </div>`;
    modalContainer.appendChild(collectionModal);
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
    if (firstParent) {
        showToast(`부모 1 선택 완료! 교배할 다른 구피를 선택하세요.`);
    } else {
        showToast('교배할 첫 번째 구피를 선택하세요.');
    }
}

function selectBreedingGuppy(guppy) {
    if (guppy.stage !== 'adult') {
        showToast('성어만 교배할 수 있습니다.');
        return;
    }
    if (gameState.breedingParents.length > 0 && gameState.breedingParents[0].id === guppy.id) return;

    gameState.breedingParents.push(guppy);
    updateAllGuppySelectionUI();

    if (gameState.breedingParents.length === 2) {
        openBreedModal();
        gameState.isBreedingMode = false;
    } else {
        showToast(`부모 1 선택 완료! 교배할 다른 구피를 선택하세요.`);
    }
}

function cancelBreeding() {
    gameState.isPaused = false;
    gameState.isBreedingMode = false;
    gameState.breedingParents = [];
    updateAllGuppySelectionUI();
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
    breedModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-3xl font-bold mb-4 text-cyan-300">교배 연구소</h2>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center p-2 border border-slate-700 rounded-lg">${getGuppyCardHTML(p1)}</div>
                <div class="text-center p-2 border border-slate-700 rounded-lg">${getGuppyCardHTML(p2)}</div>
            </div>
            <div id="breed-action-container" class="text-center mb-4">
                <button id="final-breed-button" class="btn btn-primary font-bold py-2 px-8 rounded-lg">교배 실행</button>
            </div>
            <div id="breed-result-container" class="hidden">
                <h3 class="text-xl font-semibold mt-6 mb-2 text-cyan-400">결과</h3>
                <div id="breed-result-guppy" class="flex justify-center items-center p-2 border border-slate-700 rounded-lg"></div>
                <h4 class="text-lg font-semibold mt-4 mb-2 text-cyan-400">유전 보고서</h4>
                <div id="breed-report" class="text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-1"></div>
                <div class="text-center mt-4">
                    <button id="breed-result-close-button" class="btn w-1/2">닫기</button>
                </div>
            </div>
        </div>
    `;
    modalContainer.appendChild(breedModal);

    breedModal.querySelector('#final-breed-button').addEventListener('click', () => {
        const { newGuppy, inheritance } = breedGuppies(p1, p2);
        breedModal.querySelector('#breed-result-guppy').innerHTML = getGuppyCardHTML(newGuppy);

        let reportHTML = `<p>패턴: ${newGuppy.pattern.type} (부모 ${inheritance.pattern}에게서 유전)</p>`;
        newGuppy.pattern.colors.forEach((childColor, i) => {
            const colorLabel = i === 0 ? '몸통색' : `무늬색${i}`;
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
                    <p class="text-xs text-slate-400 pl-4">부모 ${parentNum}의 색상(R:${parentColor.r} G:${parentColor.g} B:${parentColor.b})에서 변이</p>
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
            <div class="static-guppy-container">
                <div class="static-guppy" style="background-color: ${toRgbString(guppy.pattern.colors[0])};">
                    <div class="pattern-overlay" style="${getPatternStyle(guppy.pattern)}"></div>
                    <div class="static-guppy-tail" style="border-left-color: ${toRgbString({ r: Math.max(0, guppy.pattern.colors[0].r - 30), g: Math.max(0, guppy.pattern.colors[0].g - 30), b: Math.max(0, guppy.pattern.colors[0].b - 30) })};"></div>
                </div>
            </div>
        </div>
        <p class="font-bold">ID: ${guppy.id || '새로운 구피'}</p>
        <p class="text-sm">패턴: ${guppy.pattern.type}</p>
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
            optionsHTML += `<button class="move-to-aq-button btn w-full" data-target-index="${index}">수조 ${index + 1} (으)로 보내기</button>`;
        }
    });

    moveModal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal-button absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-white">&times;</button>
            <h2 class="text-2xl font-bold mb-4 text-cyan-300">어디로 옮길까요?</h2>
            <div class="space-y-2">${optionsHTML}</div>
        </div>
    `;
    modalContainer.appendChild(moveModal);
}

// --- 이벤트 리스너 ---
startButton.addEventListener('click', () => {
    introWrapper.classList.add('hidden');
    mainAppScreen.classList.remove('hidden');
    mainAppScreen.classList.add('flex');
    if (!gameInitialized) {
        init();
        gameInitialized = true;
    }
});

feedButton.addEventListener('click', () => {
    if (gameState.coins >= FEED_COST) {
        gameState.coins -= FEED_COST;
        const currentAq = gameState.aquariums[gameState.currentAquariumIndex];
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * (aquarium.clientWidth - 10);
            const y = Math.random() * 20;
            currentAq.food.push(new Food(x, y));
        }
    } else { showToast('코인이 부족합니다!'); }
});
cleanButton.addEventListener('click', () => {
    gameState.aquariums[gameState.currentAquariumIndex].waterQuality = 100;
    updateUI();
});
breedButton.addEventListener('click', () => startBreeding());

infoBreedButton.addEventListener('click', () => {
    const guppy = findGuppyById(gameState.currentInfoGuppyId);
    if (guppy) startBreeding(guppy);
});

infoRehomeButton.addEventListener('click', () => {
    rehomeGuppy(gameState.currentInfoGuppyId);
    guppyInfoPanel.classList.add('hidden');
});

infoMoveButton.addEventListener('click', openMoveGuppyModal);

closeInfoPanelButton.addEventListener('click', () => guppyInfoPanel.classList.add('hidden'));

prevAquariumButton.addEventListener('click', () => switchAquarium(-1));
nextAquariumButton.addEventListener('click', () => switchAquarium(1));

document.body.addEventListener('click', (e) => {
    if (e.target.classList.contains('rehome-button')) {
        const guppyId = parseInt(e.target.dataset.guppyId);
        rehomeGuppy(guppyId);
    }
    if (!e.target.closest('.guppy') && !e.target.closest('#guppy-info-panel') && !e.target.closest('#guppy-list-modal')) {
        guppyInfoPanel.classList.add('hidden');
    }
    if (e.target.id === 'aquarium') {
        if (gameState.isBreedingMode) {
            cancelBreeding();
            showToast('교배가 취소되었습니다.');
        }
    }
    if (e.target.classList.contains('close-modal-button') || e.target.classList.contains('modal-overlay')) {
        const modal = e.target.closest('.modal-overlay');
        if (modal) {
            if (modal.id === 'breed-modal') cancelBreeding();
            modal.remove();
        }
    }
    if (e.target.classList.contains('buy-button')) {
        buyItem(e.target.dataset.itemId);
    }
    if (e.target.classList.contains('move-to-aq-button')) {
        const targetIndex = parseInt(e.target.dataset.targetIndex);
        const guppyToMove = findGuppyById(gameState.currentInfoGuppyId);
        const sourceAq = gameState.aquariums[gameState.currentAquariumIndex];

        const guppyIndex = sourceAq.guppies.findIndex(g => g.id === guppyToMove.id);
        if (guppyIndex > -1) {
            sourceAq.guppies.splice(guppyIndex, 1);
            guppyToMove.destroy();

            gameState.aquariums[targetIndex].guppies.push(guppyToMove);

            guppyInfoPanel.classList.add('hidden');
            e.target.closest('.modal-overlay').remove();
            showToast(`구피를 수조 ${targetIndex + 1}(으)로 옮겼습니다.`);
        }
    }
});

function openModal(type) {
    const modal = document.createElement('div');
    modal.id = `${type}-modal`;
    modal.className = 'modal-overlay';
    let content = '';
    switch (type) {
        case 'manual':
            content = `
                <h2 class="text-3xl font-bold mb-4 text-cyan-300">Guppy Lab 게임 매뉴얼</h2>
                <p class="text-slate-300">다양한 색상과 패턴을 가진 구피들을 교배시켜 세상에 하나뿐인 특별한 구피 컬렉션을 만드는 것이 목표입니다.</p>
                <h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-400">구피 관리하기</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-300">
                    <li><b>먹이주기</b>: 구피들이 배고파 수면에서 입질을 하면 '먹이주기' 버튼(10코인)을 눌러주세요.</li>
                    <li><b>청소하기</b>: '청소하기' 버튼으로 수질을 100%로 회복시킬 수 있습니다.</li>
                    <li><b>성장</b>: 구피는 20초가 지나면 '치어'에서 '성어'로 성장하며, 성어만 교배할 수 있습니다.</li>
                </ul>
                <h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-400">교배 (브리딩)</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-300">
                    <li><b>수동 교배</b>: '교배 시작하기' 버튼을 누르거나 구피 정보창에서 '교배'를 선택해 직접 짝을 맺어줄 수 있습니다.</li>
                    <li><b>자동 번식</b>: 허기가 20 미만인 성어들은 서로 만나면 스스로 번식하기도 합니다.</li>
                </ul>
                <h3 class="text-xl font-semibold mt-4 mb-2 text-cyan-400">기타 팁</h3>
                <ul class="list-disc list-inside space-y-2 text-slate-300">
                    <li><b>수조 관리</b>: 상점에서 새 수조를 구매하고, 수조 옆 화살표로 이동할 수 있습니다. 구피 정보창에서 다른 수조로 구피를 옮길 수도 있습니다.</li>
                    <li><b>상세 정보</b>: 우측 상단의 물고기(🐟) 버튼을 눌러 현재 수조의 구피 목록을 열고, 목록에서 구피를 클릭해 상세 정보를 확인하세요.</li>
                    <li><b>코인 얻기</b>: 새로운 조합의 구피를 탄생시키면 50코인을 얻습니다.</li>
                    <li><b>자동 저장</b>: 게임은 1초마다 자동으로 저장됩니다.</li>
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

manualButton.addEventListener('click', () => openModal('manual'));
guppyListButton.addEventListener('click', openGuppyList);
shopButton.addEventListener('click', openShop);
collectionButton.addEventListener('click', openCollection);

function init() {
    if (!loadGame()) {
        const p1 = { type: 'spots', colors: [{ r: 255, g: 255, b: 255 }, { r: 255, g: 0, b: 0 }] };
        const p2 = { type: 'stripes', colors: [{ r: 20, g: 20, b: 255 }, { r: 255, g: 255, b: 0 }] };
        const guppy1 = new Guppy(gameState.nextGuppyId++, p1);
        const guppy2 = new Guppy(gameState.nextGuppyId++, p2);
        gameState.aquariums[0].guppies.push(guppy1, guppy2);
        gameState.discoveredPatterns.add(getPatternKey(p1));
        gameState.discoveredPatterns.add(getPatternKey(p2));
    }

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
