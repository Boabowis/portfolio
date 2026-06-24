let SIZE = 4; 
const BOARD_SIZE = 400; 
let PIECE_SIZE;
let OFFSET;

const board = document.getElementById('board');
const piecesContainer = document.getElementById('pieces-container');
const modal = document.getElementById('minigame-modal');
const minigameBtn = document.getElementById('minigame-btn');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const gifContainer = document.getElementById('modal-gif-container'); 
const minigameGrid = document.getElementById('minigame-grid');

let placedPieces = 0;
let rightTab = [];
let bottomTab = [];
let upcomingMilestones = [];
let availableMinigames = [];

let isGateMode = true;
let currentImageUrl = '';
let globalBgWidth = 400;
let globalBgHeight = 400;
let globalBgOffsetX = 0;
let globalBgOffsetY = 0;

let totalEvents = 0;
let eventsCompleted = 0;

let eventsEnabled = true;
let bgIsWhite = false;
let tutorialStep = 0;

function toggleEvents() {
    eventsEnabled = !eventsEnabled;
    const btn = document.getElementById('events-toggle-btn');
    if(eventsEnabled) {
        btn.innerHTML = '⚡ Eventos: ON';
        btn.style.borderColor = '#e94560';
        btn.style.color = '#fff';
    } else {
        btn.innerHTML = '⚡ Eventos: OFF';
        btn.style.borderColor = '#555';
        btn.style.color = '#888';
    }
}

function toggleBoardBg() {
    bgIsWhite = !bgIsWhite;
    if(bgIsWhite) {
        board.style.backgroundColor = '#ffffff';
        piecesContainer.style.backgroundColor = '#e0e0e0';
        document.querySelectorAll('.drop-zone').forEach(dz => dz.style.border = '1px dashed rgba(0,0,0,0.2)');
    } else {
        board.style.backgroundColor = 'rgba(15, 52, 96, 0.3)';
        piecesContainer.style.backgroundColor = 'rgba(15, 52, 96, 0.5)';
        document.querySelectorAll('.drop-zone').forEach(dz => dz.style.border = '1px dashed rgba(255,255,255,0.1)');
    }
}

const tutorialSteps = [
    { target: 'hud-volver', title: '⬅ Volver', text: 'Sal del puzzle en cualquier momento para elegir otra imagen.' },
    { target: 'events-toggle-btn', title: '⚡ Eventos', text: 'Desactiva esto si prefieres hacer el puzzle sin que te salten minijuegos sorpresa.' },
    { target: 'event-tracker', title: 'Progreso', text: 'Aquí verás cuántos minijuegos tiene el puzzle. Se pondrán verdes al superarlos.' },
    { target: 'hint-btn', title: '👁️ Ver Guía', text: 'Si te atascas, pulsa este botón para ver la imagen original.' },
    { target: 'bg-toggle-btn', title: '💡 Fondo', text: 'Cambia el contraste de la mesa si no ves bien algunas piezas muy oscuras.' }
];

function startTutorial() {
    if(localStorage.getItem('tutorialDone')) return;
    document.getElementById('tutorial-overlay').classList.remove('hidden');
    showTutorialStep(0);
}

function showTutorialStep(step) {
    const oldClone = document.getElementById('tut-clone');
    if (oldClone) oldClone.remove();

    if (step >= tutorialSteps.length) {
        document.getElementById('tutorial-overlay').classList.add('hidden');
        localStorage.setItem('tutorialDone', 'true');
        return;
    }
    
    tutorialStep = step;
    const current = tutorialSteps[step];
    const targetEl = document.getElementById(current.target);
    
    // Clonar elemento para que se vea nítido por encima del desenfoque
    if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const clone = targetEl.cloneNode(true);
        clone.id = 'tut-clone';
        clone.style.position = 'fixed';
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.margin = '0';
        clone.style.zIndex = '10005';
        clone.classList.add('tutorial-highlight');
        document.getElementById('tutorial-overlay').appendChild(clone);
    }

    document.getElementById('tut-title').textContent = current.title;
    document.getElementById('tut-text').textContent = current.text;
}

const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svgContainer.style.position = "absolute";
svgContainer.style.width = "0";
svgContainer.style.height = "0";
document.body.appendChild(svgContainer);

// ==========================================
// UTILIDAD: CALCULAR CROP (OBJECT-FIT COVER) EN JS
// ==========================================
function prepareImage(url, callback) {
    if (!url) { callback(); return; }
    const img = new Image();
    img.onload = () => {
        const scale = Math.max(BOARD_SIZE / img.width, BOARD_SIZE / img.height);
        globalBgWidth = img.width * scale;
        globalBgHeight = img.height * scale;
        globalBgOffsetX = (globalBgWidth - BOARD_SIZE) / 2;
        globalBgOffsetY = (globalBgHeight - BOARD_SIZE) / 2;
        callback();
    };
    img.onerror = () => {
        globalBgWidth = BOARD_SIZE;
        globalBgHeight = BOARD_SIZE;
        globalBgOffsetX = 0;
        globalBgOffsetY = 0;
        callback();
    };
    img.src = url;
}


// ==========================================
// FLUJO DE PANTALLAS
// ==========================================
window.onload = () => {
    initGate();
};

function initGate() {
    isGateMode = true;
    document.body.classList.add('gate-mode');
    document.getElementById('gallery-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-hud').style.display = 'none';
    
    document.getElementById('main-game').style.display = 'flex';
    document.getElementById('main-game').style.justifyContent = 'center';
    document.getElementById('main-game').style.alignItems = 'center';
    document.getElementById('main-game').style.height = '100vh';
    
    document.getElementById('game-title').style.display = 'none';
    document.getElementById('game-subtitle').style.display = 'none';
    
    startGameEngine(2);
}

function showGallery() {
    document.body.classList.remove('gate-mode');
    document.getElementById('main-game').style.display = 'none';
    document.getElementById('start-screen').style.display = 'none';
    const galleryScreen = document.getElementById('gallery-screen');
    galleryScreen.style.display = 'flex';
    galleryScreen.classList.remove('fade-in');
    void galleryScreen.offsetWidth; 
    galleryScreen.classList.add('fade-in');
    
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    const galleryImages = [
        // GIFs
        'assets/img2.gif', 'assets/img4.gif', 'assets/img5.gif', 'assets/img7.gif',
        'assets/img10.gif', 'assets/img14.gif', 'assets/img15.gif', 'assets/img16.gif',
        'assets/img19.gif', 'assets/img20.gif', 'assets/img22.gif', 'assets/img23.gif',
        // Estáticas
        'assets/img1.jfif', 'assets/img3.jfif', 'assets/img6.jfif', 'assets/img8.jfif',
        'assets/img9.jfif', 'assets/img11.jfif', 'assets/img12.jfif', 'assets/img13.jfif',
        'assets/img17.jfif', 'assets/img18.jfif', 'assets/img21.jfif'
    ];
    
    galleryImages.forEach(url => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.backgroundImage = `url('${url}')`; 
        
        item.onclick = () => {
            document.getElementById('gallery-screen').style.display = 'none';
            document.getElementById('start-screen').style.display = 'flex';
            currentImageUrl = url;
        };
        grid.appendChild(item);
    });
}

function goBackToGallery() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('gallery-screen').style.display = 'flex';
}

function goBackToGalleryFromGame() {
    board.innerHTML = '';
    piecesContainer.innerHTML = '';
    document.getElementById('main-game').style.display = 'none';
    document.getElementById('gallery-screen').style.display = 'flex';
}

function startMainGame(selectedSize) {
    isGateMode = false;
    document.body.classList.remove('gate-mode');
    document.getElementById('start-screen').style.display = 'none';
    
    document.getElementById('main-game').style.display = 'block';
    document.getElementById('main-game').style.height = 'auto';
    
    document.getElementById('game-title').style.display = 'none';
    document.getElementById('game-subtitle').style.display = 'none';
    document.getElementById('game-hud').style.display = 'flex';
    document.getElementById('bg-toggle-btn').classList.remove('hidden');
    
    eventsEnabled = true;
    bgIsWhite = false;
    document.getElementById('events-toggle-btn').innerHTML = '⚡ Eventos: ON';
    document.getElementById('events-toggle-btn').style.borderColor = '#e94560';
    document.getElementById('events-toggle-btn').style.color = '#fff';
    board.style.backgroundColor = 'rgba(15, 52, 96, 0.3)';
    piecesContainer.style.backgroundColor = 'rgba(15, 52, 96, 0.5)';
    
    prepareImage(currentImageUrl, () => {
        startGameEngine(selectedSize);
        setTimeout(startTutorial, 500);
    });
}


function showReference() {
    document.getElementById('reference-modal').classList.remove('hidden');
}

// ==========================================
// MOTOR DEL PUZZLE
// ==========================================
function startGameEngine(selectedSize) {
    SIZE = selectedSize;
    PIECE_SIZE = BOARD_SIZE / SIZE;
    OFFSET = PIECE_SIZE * 0.25; 
    
    board.innerHTML = '';
    piecesContainer.innerHTML = '';
    svgContainer.innerHTML = ''; 
    
    board.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${SIZE}, 1fr)`;

    if (!isGateMode) {
        const refImg = document.getElementById('full-reference-image');
        refImg.style.backgroundImage = `url('${currentImageUrl}')`;
        refImg.style.backgroundSize = 'cover';
        refImg.style.backgroundPosition = 'center';
    }

    placedPieces = 0;
    rightTab = [];
    bottomTab = [];
    
    if (!isGateMode) {
        availableMinigames = [
            startReflexGame, startPipeGame,
            startSpamClickGame, startSimonGame, startTimingGame,
            startMemoryPairsGame, startMathGame
        ]; 
        
        if (SIZE === 7) upcomingMilestones = [10, 25, 40]; 
        else if (SIZE === 10) upcomingMilestones = [20, 45, 70, 90]; 
        else if (SIZE === 12) upcomingMilestones = [25, 55, 85, 115, 135]; 
        
        totalEvents = upcomingMilestones.length;
        eventsCompleted = 0;
        
        const tracker = document.getElementById('event-tracker');
        if(tracker) {
            tracker.innerHTML = '';
            for(let i=0; i<totalEvents; i++) {
                const dot = document.createElement('div');
                dot.className = 'event-dot';
                tracker.appendChild(dot);
            }
        }
    } else {
        upcomingMilestones = [];
    }

    for (let r = 0; r < SIZE; r++) {
        rightTab.push([]);
        bottomTab.push([]);
        for (let c = 0; c < SIZE; c++) {
            rightTab[r].push(Math.random() > 0.5 ? 1 : -1);
            bottomTab[r].push(Math.random() > 0.5 ? 1 : -1);
        }
    }
    
    initBoard();
}

// ... EL RESTO DEL CÓDIGO PERMANECE IGUAL HASTA checkMilestones ...

function initBoard() {
// (El contenido de initBoard no cambia)
    for (let i = 0; i < SIZE * SIZE; i++) {
        const dropZone = document.createElement('div');
        dropZone.classList.add('drop-zone');
        dropZone.dataset.index = i;
        dropZone.style.width = `${PIECE_SIZE}px`;
        dropZone.style.height = `${PIECE_SIZE}px`;
        board.appendChild(dropZone);
    }

    let pieces = [];
    const T = OFFSET; 
    
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            
            let pathD = `M ${T} ${T} `; 
            if (row === 0) pathD += `L ${PIECE_SIZE + T} ${T} `;
            else {
                let tab = bottomTab[row-1][col]; 
                if (tab === 1) pathD += `L ${PIECE_SIZE/2} ${T} C ${PIECE_SIZE/2} ${T*2}, ${PIECE_SIZE/2 + T*2} ${T*2}, ${PIECE_SIZE/2 + T*2} ${T} L ${PIECE_SIZE + T} ${T} `;
                else pathD += `L ${PIECE_SIZE/2} ${T} C ${PIECE_SIZE/2} 0, ${PIECE_SIZE/2 + T*2} 0, ${PIECE_SIZE/2 + T*2} ${T} L ${PIECE_SIZE + T} ${T} `;
            }
            if (col === SIZE - 1) pathD += `L ${PIECE_SIZE + T} ${PIECE_SIZE + T} `;
            else {
                let tab = rightTab[row][col];
                if (tab === 1) pathD += `L ${PIECE_SIZE + T} ${PIECE_SIZE/2} C ${PIECE_SIZE + T*2} ${PIECE_SIZE/2}, ${PIECE_SIZE + T*2} ${PIECE_SIZE/2 + T*2}, ${PIECE_SIZE + T} ${PIECE_SIZE/2 + T*2} L ${PIECE_SIZE + T} ${PIECE_SIZE + T} `;
                else pathD += `L ${PIECE_SIZE + T} ${PIECE_SIZE/2} C ${PIECE_SIZE} ${PIECE_SIZE/2}, ${PIECE_SIZE} ${PIECE_SIZE/2 + T*2}, ${PIECE_SIZE + T} ${PIECE_SIZE/2 + T*2} L ${PIECE_SIZE + T} ${PIECE_SIZE + T} `;
            }
            if (row === SIZE - 1) pathD += `L ${T} ${PIECE_SIZE + T} `;
            else {
                let tab = bottomTab[row][col];
                if (tab === 1) pathD += `L ${PIECE_SIZE/2 + T*2} ${PIECE_SIZE + T} C ${PIECE_SIZE/2 + T*2} ${PIECE_SIZE + T*2}, ${PIECE_SIZE/2} ${PIECE_SIZE + T*2}, ${PIECE_SIZE/2} ${PIECE_SIZE + T} L ${T} ${PIECE_SIZE + T} `;
                else pathD += `L ${PIECE_SIZE/2 + T*2} ${PIECE_SIZE + T} C ${PIECE_SIZE/2 + T*2} ${PIECE_SIZE}, ${PIECE_SIZE/2} ${PIECE_SIZE}, ${PIECE_SIZE/2} ${PIECE_SIZE + T} L ${T} ${PIECE_SIZE + T} `;
            }
            if (col === 0) pathD += `L ${T} ${T} `;
            else {
                let tab = rightTab[row][col-1];
                if (tab === 1) pathD += `L ${T} ${PIECE_SIZE/2 + T*2} C ${T*2} ${PIECE_SIZE/2 + T*2}, ${T*2} ${PIECE_SIZE/2}, ${T} ${PIECE_SIZE/2} L ${T} ${T} `;
                else pathD += `L ${T} ${PIECE_SIZE/2 + T*2} C 0 ${PIECE_SIZE/2 + T*2}, 0 ${PIECE_SIZE/2}, ${T} ${PIECE_SIZE/2} L ${T} ${T} `;
            }
            pathD += "Z"; 

            const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
            const clipPathId = `clip-${Math.random().toString(36).substr(2, 9)}`;
            clipPath.setAttribute("id", clipPathId);
            const pathNode = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathNode.setAttribute("d", pathD);
            clipPath.appendChild(pathNode);
            svgContainer.appendChild(clipPath);

            const piece = document.createElement('div');
            piece.classList.add('piece');
            
            const totalSize = PIECE_SIZE + (T * 2);
            piece.style.width = `${totalSize}px`;
            piece.style.height = `${totalSize}px`;
            piece.style.margin = `5px`; 
            piece.style.clipPath = `url(#${clipPathId})`;
            
            if (isGateMode) {
                const gateColors = ['#e94560', '#0f3460', '#ffb400', '#00ff00'];
                piece.style.backgroundColor = gateColors[row * SIZE + col];
                piece.style.backgroundImage = 'none';
            } else {
                piece.style.backgroundImage = `url('${currentImageUrl}')`;
                piece.style.backgroundSize = `${globalBgWidth}px ${globalBgHeight}px`;
                // El backgroundPosition compensa el offset para recortar y escalar dinámicamente
                const xPos = -(col * PIECE_SIZE - T) - globalBgOffsetX;
                const yPos = -(row * PIECE_SIZE - T) - globalBgOffsetY;
                piece.style.backgroundPosition = `${xPos}px ${yPos}px`;
            }
            
            piece.dataset.correctIndex = row * SIZE + col;
            piece.addEventListener('pointerdown', pointerDown);
            pieces.push(piece);
        }
    }

    pieces.sort(() => Math.random() - 0.5);
    
    if (isGateMode) {
        const corners = [
            { top: '10vh', left: '10vw' },
            { top: '10vh', left: '70vw' },
            { top: '60vh', left: '10vw' },
            { top: '60vh', left: '70vw' }
        ];
        pieces.forEach((p, idx) => {
            p.style.position = 'absolute';
            p.style.top = corners[idx].top;
            p.style.left = corners[idx].left;
            piecesContainer.appendChild(p);
        });
    } else {
        pieces.forEach(p => piecesContainer.appendChild(p));
    }
}

let activePiece = null;
let offsetX = 0;
let offsetY = 0;
let currentDropZone = null;

function pointerDown(e) {
    if (this.dataset.locked === 'true') return; 
    activePiece = this;
    const rect = activePiece.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    activePiece.classList.add('is-dragging');
    activePiece.classList.remove('in-board');
    activePiece.style.position = 'fixed';
    activePiece.style.left = rect.left + 'px';
    activePiece.style.top = rect.top + 'px';
    
    document.body.appendChild(activePiece);
    e.preventDefault(); 
}

function pointerMove(e) {
    if (!activePiece) return;
    activePiece.style.left = (e.clientX - offsetX) + 'px';
    activePiece.style.top = (e.clientY - offsetY) + 'px';
    
    activePiece.style.visibility = 'hidden';
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    activePiece.style.visibility = 'visible';
    
    const dropZone = elem ? elem.closest('.drop-zone') : null;
    
    if (currentDropZone !== dropZone) {
        if (currentDropZone) currentDropZone.style.backgroundColor = 'transparent';
        if (dropZone && dropZone.children.length === 0) dropZone.style.backgroundColor = 'rgba(233, 69, 96, 0.3)';
        currentDropZone = dropZone;
    }
}

function pointerUp(e) {
    if (!activePiece) return;
    if (currentDropZone) currentDropZone.style.backgroundColor = 'transparent';

    activePiece.style.visibility = 'hidden';
    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    activePiece.style.visibility = 'visible';

    const dropZone = dropTarget ? dropTarget.closest('.drop-zone') : null;
    activePiece.classList.remove('is-dragging');

    if (dropZone && dropZone.children.length === 0) {
        activePiece.style.position = '';
        activePiece.style.left = '';
        activePiece.style.top = '';
        dropZone.appendChild(activePiece);
        activePiece.classList.add('in-board');
        activePiece.style.top = `-${OFFSET}px`;
        activePiece.style.left = `-${OFFSET}px`;
        checkPiecePlacement(activePiece, dropZone);
    } else {
        piecesContainer.appendChild(activePiece);
        activePiece.classList.remove('in-board');
        if (isGateMode) {
            activePiece.style.position = 'absolute';
            activePiece.style.left = (e.clientX - offsetX) + 'px';
            activePiece.style.top = (e.clientY - offsetY) + 'px';
        } else {
            activePiece.style.position = '';
            activePiece.style.left = '';
            activePiece.style.top = '';
        }
    }
    
    activePiece = null;
    currentDropZone = null;
}

document.addEventListener('pointermove', pointerMove);
document.addEventListener('pointerup', pointerUp);

function checkPiecePlacement(piece, dropZone) {
    const isCorrect = piece.dataset.correctIndex === dropZone.dataset.index;
    
    if (isCorrect) {
        piece.dataset.locked = 'true'; 
        piece.style.cursor = 'default';
        piece.classList.add('correct-glow');
        placedPieces++;
        
        if (isGateMode) {
            if (placedPieces === SIZE * SIZE) {
                board.classList.add('portal-transition');
                setTimeout(() => {
                    showGallery();
                    board.classList.remove('portal-transition');
                }, 1000);
            }
        } else {
            checkMilestones();
        }
    }
}

// ... EL RESTO DEL CÓDIGO (AUTOFILL Y MINIJUEGOS) ...
function autofillInnerPieces(amount, onComplete) {
    let unplacedInner = [];
    const allPieces = Array.from(document.querySelectorAll('.pieces-container .piece'));
    
    allPieces.forEach(piece => {
        const correctIndex = parseInt(piece.dataset.correctIndex);
        const row = Math.floor(correctIndex / SIZE);
        const col = correctIndex % SIZE;
        if (row > 0 && row < SIZE - 1 && col > 0 && col < SIZE - 1) unplacedInner.push(piece);
    });
    
    if (unplacedInner.length === 0) unplacedInner = allPieces; 
    unplacedInner.sort(() => Math.random() - 0.5); 
    const piecesToPlace = unplacedInner.slice(0, amount);
    
    if (piecesToPlace.length === 0) {
        if (onComplete) onComplete();
        return;
    }

    let completedAnimations = 0;
    piecesToPlace.forEach((piece, index) => {
        piece.dataset.locked = 'true';
        setTimeout(() => {
            const correctIndex = piece.dataset.correctIndex;
            const dropZone = document.querySelector(`.drop-zone[data-index="${correctIndex}"]`);
            const startRect = piece.getBoundingClientRect();
            const endRect = dropZone.getBoundingClientRect();
            
            piece.style.position = 'fixed';
            piece.style.left = startRect.left + 'px';
            piece.style.top = startRect.top + 'px';
            piece.style.margin = '0';
            piece.style.zIndex = '9999';
            document.body.appendChild(piece);
            piece.offsetHeight;
            piece.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
            piece.style.left = (endRect.left - OFFSET) + 'px';
            piece.style.top = (endRect.top - OFFSET) + 'px';
            piece.style.transform = 'scale(1.1)'; 
            
            setTimeout(() => {
                piece.style.transition = 'transform 0.1s';
                piece.style.transform = '';
                piece.style.position = 'absolute';
                dropZone.appendChild(piece);
                piece.classList.add('in-board');
                piece.style.top = `-${OFFSET}px`;
                piece.style.left = `-${OFFSET}px`;
                piece.classList.add('correct-glow');
                placedPieces++;
                completedAnimations++;
                if (completedAnimations === piecesToPlace.length) {
                    if (onComplete) onComplete();
                }
            }, 800); 
        }, index * 400); 
    });
}

function showCustomMessage(title, message, btnText, callback, showGif = false) {
    modal.classList.remove('hidden');
    modalTitle.textContent = title;
    modalDesc.innerHTML = message;
    
    if (showGif) gifContainer.style.display = 'block';
    else gifContainer.style.display = 'none';
    
    if (btnText) {
        minigameBtn.style.display = 'inline-block';
        minigameBtn.textContent = btnText;
        minigameBtn.onclick = () => {
            modal.classList.add('hidden');
            if (callback) callback();
        };
    } else {
        minigameBtn.style.display = 'none';
    }
}

// Eliminado: Encuentra el distinto
// 2. Atrapa la Bola (Reflejos)
function startReflexGame(onSuccess) {
    minigameGrid.innerHTML = '';
    minigameGrid.style.display = 'block'; 
    minigameGrid.classList.remove('hidden');
    const arena = document.createElement('div');
    arena.style.width = '100%';
    arena.style.height = '200px';
    arena.style.position = 'relative';
    arena.style.backgroundColor = 'rgba(0,0,0,0.3)';
    arena.style.borderRadius = '8px';
    arena.style.margin = '0 auto';
    const target = document.createElement('div');
    target.style.width = '45px';
    target.style.height = '45px';
    target.style.backgroundColor = '#00ff00';
    target.style.borderRadius = '50%';
    target.style.position = 'absolute';
    target.style.cursor = 'crosshair';
    target.style.transition = 'top 0.4s ease-out, left 0.4s ease-out, background-color 0.2s';
    let clicksNeeded = 3;
    const moveTarget = () => {
        target.style.left = (Math.random() * (300 - 45)) + 'px';
        target.style.top = (Math.random() * (200 - 45)) + 'px';
    };
    target.onclick = () => {
        clicksNeeded--;
        if (clicksNeeded <= 0) {
            clearInterval(moveInterval);
            minigameGrid.style.display = 'none';
            onSuccess();
        } else {
            target.style.backgroundColor = clicksNeeded === 2 ? '#ffff00' : '#ff3333';
            moveTarget();
        }
    };
    arena.appendChild(target);
    minigameGrid.appendChild(arena);
    moveTarget();
    const moveInterval = setInterval(moveTarget, 900);
}

// 3. Hackeo de Tuberías (Estilo Bioshock)
function startPipeGame(onSuccess) {
    minigameGrid.innerHTML = '';
    minigameGrid.style.display = 'flex';
    minigameGrid.style.gap = '5px';
    minigameGrid.classList.remove('hidden');
    const pipes = [];
    for(let i=0; i<4; i++) {
        const pipe = document.createElement('div');
        pipe.style.width = '60px';
        pipe.style.height = '60px';
        pipe.style.backgroundColor = '#2a2a4a';
        pipe.style.position = 'relative';
        pipe.style.cursor = 'pointer';
        pipe.style.transition = 'transform 0.2s';
        pipe.style.borderRadius = '8px';
        const line = document.createElement('div');
        line.style.width = '100%';
        line.style.height = '12px';
        line.style.backgroundColor = '#00ff00';
        line.style.position = 'absolute';
        line.style.top = '24px';
        pipe.appendChild(line);
        let rot = (Math.floor(Math.random() * 3) + 1) * 90; 
        pipe.dataset.rot = rot;
        pipe.style.transform = `rotate(${rot}deg)`;
        pipe.onclick = () => {
            rot += 90;
            pipe.dataset.rot = rot;
            pipe.style.transform = `rotate(${rot}deg)`;
            if(pipes.every(p => parseInt(p.dataset.rot) % 180 === 0)) {
                setTimeout(() => {
                    minigameGrid.style.display = 'none';
                    onSuccess();
                }, 300);
            }
        };
        pipes.push(pipe);
        minigameGrid.appendChild(pipe);
    }
}

// 4. Machaca el botón (Fuerza)
function startSpamClickGame(onSuccess) {
    minigameGrid.innerHTML = '';
    minigameGrid.style.display = 'flex';
    minigameGrid.style.flexDirection = 'column';
    minigameGrid.style.alignItems = 'center';
    minigameGrid.classList.remove('hidden');
    const barContainer = document.createElement('div');
    barContainer.style.width = '200px';
    barContainer.style.height = '20px';
    barContainer.style.border = '2px solid #e94560';
    barContainer.style.borderRadius = '10px';
    barContainer.style.overflow = 'hidden';
    barContainer.style.marginBottom = '15px';
    const bar = document.createElement('div');
    bar.style.width = '0%';
    bar.style.height = '100%';
    bar.style.backgroundColor = '#e94560';
    bar.style.transition = 'width 0.1s';
    barContainer.appendChild(bar);
    const btn = document.createElement('button');
    btn.textContent = '¡Carga la Batería! (Haz clic rápido)';
    btn.className = 'hint-btn'; 
    btn.style.position = 'static';
    let clicks = 0;
    const maxClicks = 15;
    btn.onclick = () => {
        clicks++;
        bar.style.width = `${(clicks/maxClicks)*100}%`;
        btn.style.transform = `scale(${1 + Math.random()*0.1})`;
        setTimeout(() => btn.style.transform = 'scale(1)', 50);
        if(clicks >= maxClicks) {
            minigameGrid.style.display = 'none';
            onSuccess();
        }
    };
    minigameGrid.appendChild(barContainer);
    minigameGrid.appendChild(btn);
}

// 5. Simón Dice (Memoria)
function startSimonGame(onSuccess) {
    minigameGrid.innerHTML = '';
    minigameGrid.style.display = 'flex';
    minigameGrid.style.gap = '15px';
    minigameGrid.classList.remove('hidden');
    const colors = ['#ff3333', '#33ff33', '#3333ff'];
    const btns = [];
    const sequence = [];
    let playerStep = 0;
    let playable = false;
    
    function playSequence() {
        let step = 0;
        const interval = setInterval(() => {
            if(step >= sequence.length) {
                clearInterval(interval);
                playable = true;
                return;
            }
            const b = btns[sequence[step]];
            b.style.opacity = '1';
            setTimeout(() => b.style.opacity = '0.2', 400);
            step++;
        }, 800);
    }

    colors.forEach((c, i) => {
        const b = document.createElement('div');
        b.style.width = '60px';
        b.style.height = '60px';
        b.style.backgroundColor = c;
        b.style.borderRadius = '8px';
        b.style.opacity = '0.2';
        b.style.cursor = 'pointer';
        b.style.transition = 'opacity 0.2s';
        b.onclick = () => {
            if(!playable) return;
            b.style.opacity = '1';
            setTimeout(() => b.style.opacity = '0.2', 200);
            if(i === sequence[playerStep]) {
                playerStep++;
                if(playerStep === sequence.length) {
                    playable = false;
                    setTimeout(() => {
                        minigameGrid.style.display = 'none';
                        onSuccess();
                    }, 400);
                }
            } else {
                playable = false;
                playerStep = 0; 
                b.style.backgroundColor = '#fff';
                setTimeout(() => {
                    b.style.backgroundColor = c;
                    setTimeout(playSequence, 500); // Repetir secuencia
                }, 200);
            }
        };
        btns.push(b);
        minigameGrid.appendChild(b);
    });
    for(let i=0; i<3; i++) sequence.push(Math.floor(Math.random() * 3));
    playSequence();
}

// 6. Barra de Tiempo (Precisión)
function startTimingGame(onSuccess) {
    minigameGrid.innerHTML = '';
    minigameGrid.style.display = 'flex';
    minigameGrid.style.flexDirection = 'column';
    minigameGrid.style.alignItems = 'center';
    minigameGrid.classList.remove('hidden');
    const desc = document.createElement('p');
    desc.textContent = "Haz clic cuando pase por el centro verde";
    desc.style.color = '#fff';
    desc.style.margin = '0 0 10px 0';
    desc.style.fontSize = '1rem';
    const arena = document.createElement('div');
    arena.style.width = '250px';
    arena.style.height = '30px';
    arena.style.backgroundColor = '#2a2a4a';
    arena.style.position = 'relative';
    arena.style.borderRadius = '15px';
    arena.style.overflow = 'hidden';
    arena.style.cursor = 'pointer';
    const target = document.createElement('div');
    target.style.position = 'absolute';
    target.style.width = '40px';
    target.style.height = '100%';
    target.style.left = '105px'; 
    target.style.backgroundColor = '#00ff00';
    target.style.opacity = '0.5';
    const cursor = document.createElement('div');
    cursor.style.position = 'absolute';
    cursor.style.width = '6px';
    cursor.style.height = '100%';
    cursor.style.backgroundColor = '#fff';
    cursor.style.left = '0px';
    arena.appendChild(target);
    arena.appendChild(cursor);
    minigameGrid.appendChild(desc);
    minigameGrid.appendChild(arena);
    let pos = 0;
    let dir = 1;
    let speed = 4;
    let playing = true;
    const move = () => {
        if(!playing) return;
        pos += dir * speed;
        if(pos > 244 || pos < 0) dir *= -1;
        cursor.style.left = pos + 'px';
        requestAnimationFrame(move);
    };
    requestAnimationFrame(move);
    arena.onclick = () => {
        if(pos >= 105 && pos <= 145) {
            playing = false;
            arena.style.backgroundColor = '#00ff00';
            setTimeout(() => {
                minigameGrid.style.display = 'none';
                onSuccess();
            }, 400);
        } else {
            speed += 1.5; 
        }
    };
}

// 7. Cartas Memory
function startMemoryPairsGame(onSuccess) {
    minigameGrid.innerHTML = '';
    minigameGrid.style.display = 'flex';
    minigameGrid.style.flexWrap = 'wrap';
    minigameGrid.style.justifyContent = 'center';
    minigameGrid.style.gap = '10px';
    minigameGrid.style.maxWidth = '250px'; 
    minigameGrid.classList.remove('hidden');
    const emojis = ['🍄', '🍄', '⭐', '⭐', '🔥', '🔥'];
    emojis.sort(() => Math.random() - 0.5);
    let flipped = [];
    let matched = 0;
    emojis.forEach((emoji) => {
        const card = document.createElement('div');
        card.style.width = '55px';
        card.style.height = '55px';
        card.style.backgroundColor = '#e94560';
        card.style.borderRadius = '8px';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
        card.style.fontSize = '24px';
        card.style.cursor = 'pointer';
        card.style.color = 'transparent'; 
        card.style.transition = 'transform 0.2s, background-color 0.2s';
        card.onclick = () => {
            if(flipped.length === 2 || card.dataset.matched || card.dataset.flipped) return;
            card.style.color = '#fff';
            card.style.transform = 'scale(1.1)';
            card.textContent = emoji;
            card.dataset.flipped = 'true';
            flipped.push({card, emoji});
            if(flipped.length === 2) {
                if(flipped[0].emoji === flipped[1].emoji) {
                    flipped.forEach(f => {
                        f.card.dataset.matched = 'true';
                        f.card.style.backgroundColor = '#00ff00';
                    });
                    matched += 2;
                    flipped = [];
                    if(matched === emojis.length) {
                        setTimeout(() => {
                            minigameGrid.style.display = 'none';
                            onSuccess();
                        }, 500);
                    }
                } else {
                    setTimeout(() => {
                        flipped.forEach(f => {
                            f.card.style.color = 'transparent';
                            f.card.style.transform = 'scale(1)';
                            delete f.card.dataset.flipped;
                        });
                        flipped = [];
                    }, 700);
                }
            }
        };
        minigameGrid.appendChild(card);
    });
}

// 8. Lógica Rápida (Matemáticas sencillas)
function startMathGame(onSuccess) {
    minigameGrid.innerHTML = '';
    minigameGrid.style.display = 'flex';
    minigameGrid.style.flexDirection = 'column';
    minigameGrid.style.alignItems = 'center';
    minigameGrid.classList.remove('hidden');
    const desc = document.createElement('p');
    desc.textContent = "¿Qué número es MAYOR?";
    desc.style.color = '#fff';
    desc.style.margin = '0 0 15px 0';
    desc.style.fontSize = '1.2rem';
    minigameGrid.appendChild(desc);
    
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'grid';
    btnContainer.style.gridTemplateColumns = '1fr 1fr';
    btnContainer.style.gap = '15px';
    
    const nums = [];
    while(nums.length < 4) {
        let n = Math.floor(Math.random() * 90) + 10;
        if(!nums.includes(n)) nums.push(n);
    }
    const max = Math.max(...nums);
    
    nums.forEach(n => {
        const btn = document.createElement('button');
        btn.textContent = n;
        btn.className = 'hint-btn';
        btn.style.position = 'static';
        btn.style.fontSize = '1.5rem';
        btn.style.padding = '15px 25px';
        btn.style.width = '100%';
        btn.style.justifyContent = 'center';
        btn.onclick = () => {
            if(n === max) {
                btn.style.backgroundColor = '#00ff00';
                btn.style.color = '#000';
                setTimeout(() => {
                    minigameGrid.style.display = 'none';
                    onSuccess();
                }, 300);
            } else {
                btn.style.backgroundColor = '#ff0000';
                setTimeout(() => btn.style.backgroundColor = 'transparent', 300);
            }
        };
        btnContainer.appendChild(btn);
    });
    minigameGrid.appendChild(btnContainer);
}


function checkMilestones() {
    if (!eventsEnabled) {
        while(upcomingMilestones.length > 0 && placedPieces >= upcomingMilestones[0]) {
            upcomingMilestones.shift();
            const dots = document.querySelectorAll('.event-dot');
            if(dots[eventsCompleted]) {
                dots[eventsCompleted].style.background = '#555';
                dots[eventsCompleted].style.boxShadow = 'none';
                eventsCompleted++;
            }
        }
        if (placedPieces >= SIZE * SIZE) triggerVictory();
        return;
    }

    if (upcomingMilestones.length > 0 && placedPieces >= upcomingMilestones[0]) {
        upcomingMilestones.shift(); 
        if (availableMinigames.length === 0) {
            availableMinigames = [
                startReflexGame, startPipeGame, 
                startSpamClickGame, startSimonGame, startTimingGame, 
                startMemoryPairsGame, startMathGame
            ];
        }
        const gameIndex = Math.floor(Math.random() * availableMinigames.length);
        const selectedGame = availableMinigames.splice(gameIndex, 1)[0];
        let rewardCount = SIZE === 7 ? 4 : (SIZE === 10 ? 7 : 10);

        showCustomMessage(
            "¡Alerta de Evento! 🚨", 
            "Has alcanzado una meta. ¡Supera este minijuego para conseguir una recompensa!", 
            null, null, false
        );
        minigameGrid.style = ''; // Reset CSS styles before every minigame to avoid column layout pollution
        selectedGame(() => {
            modal.classList.add('hidden');
            
            // Mark dot as completed
            const dots = document.querySelectorAll('.event-dot');
            if(dots[eventsCompleted]) {
                dots[eventsCompleted].classList.add('completed');
                eventsCompleted++;
            }
            
            autofillInnerPieces(rewardCount, () => {
                if (placedPieces >= SIZE * SIZE) triggerVictory();
            });
        });
    }
    
    if (placedPieces >= SIZE * SIZE) {
        triggerVictory();
    }
}

function triggerVictory() {
    setTimeout(() => {
        showCustomMessage(
            "ole ole, los caracoles 🎉", 
            "muchas gracias por probar mi proyectito", 
            "Volver a la Galería", 
            () => { 
                modal.classList.add('hidden');
                showGallery(); 
            },
            true 
        );
    }, 800); 
}
