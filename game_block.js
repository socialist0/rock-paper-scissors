// ==========================================
// game_block.js — 블록쌓기 게임 독립 모듈
// ==========================================

// ── 직사각형 블록 이미지 ──
const blockRectImage = new Image();
blockRectImage.src = 'images/busimage.png';

// ── 캔버스 및 DOM 참조 ──
let blockCanvas, blockCtx;
let blockScoreEl, blockOverlay, blockStartBtn, blockTitleEl, blockFinalScoreEl;

// ── 게임 상태 ──
const BLOCK_CANVAS_WIDTH = 400;
const BLOCK_CANVAS_HEIGHT = 500;
const BLOCK_GAME_SPEED = 4;

let blockGameActive = false;
let blockIsCollapsing = false;
let blockScore = 0;
let blockStack = [];
let blockCurrentBlock = {};
let blockCameraY = 0;
let blockTargetCameraY = 0;
let lastBlockUploadedId = null; // 하이라이트용

const blockColors = [
    '#ff595e', '#ffca3a', '#8ac926', '#1982c4',
    '#6a4c93', '#ff924c', '#4febfe', '#e85d04', '#06d6a0'
];

// ── 랭킹 저장 타임락 (security.js 패턴 동일) ──
const BLOCK_SAVE_COOLDOWN_MS = 3 * 1000;

function canSaveBlockScore() {
    const last = localStorage.getItem('block_last_save');
    if (!last) return true;
    return Date.now() - parseInt(last, 10) > BLOCK_SAVE_COOLDOWN_MS;
}

function markBlockSaveTime() {
    localStorage.setItem('block_last_save', Date.now().toString());
}

// ==========================================
// Block 클래스
// ==========================================
class BlockPiece {
    constructor(x, y, width, height, color, speed, direction, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = speed;
        this.direction = direction;
        this.type = type;
        this.topWidthOffset = this.type === 'trapezoid' ? this.width * 0.15 : 0;

        const baseMass = this.width * this.height;
        this.mass = this.type === 'trapezoid' ? baseMass * 0.85 : baseMass;

        this.isBreaking = false;
        this.fallAngle = 0;
        this.fallSpeed = 0;
        this.pivotX = 0;
        this.pivotY = 0;
        this.velY = 0;
    }

    getCenter() {
        return this.x + this.width / 2;
    }

    getTopSurfaceBounds() {
        return {
            left: this.x + this.topWidthOffset,
            right: this.x + this.width - this.topWidthOffset
        };
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x + this.width > BLOCK_CANVAS_WIDTH) {
            this.x = BLOCK_CANVAS_WIDTH - this.width;
            this.direction = -1;
        } else if (this.x < 0) {
            this.x = 0;
            this.direction = 1;
        }
    }

    // 신규
    drawAtOrigin(ctx) {
        // 신규
        if (this.type === 'rectangle' && blockRectImage.complete) {
            const dx = -this.width / 2, dy = -this.height / 2;
            ctx.drawImage(blockRectImage, dx, dy, this.width, this.height);
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = this.color;
            ctx.fillRect(dx, dy, this.width, this.height);
            ctx.restore();
            return;
        }

        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (this.type === 'rectangle' || this.type === 'tall') {
            ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        } else if (this.type === 'trapezoid') {
            ctx.moveTo(-this.width / 2, this.height / 2);
            ctx.lineTo(-this.width / 2 + this.topWidthOffset, -this.height / 2);
            ctx.lineTo(this.width / 2 - this.topWidthOffset, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // 신규
    drawNormal(ctx, offsetY) {
        // 신규
        if (this.type === 'rectangle' && blockRectImage.complete) {
            ctx.drawImage(blockRectImage, this.x, this.y + offsetY, this.width, this.height);
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y + offsetY, this.width, this.height);
            ctx.restore();
            return;
        }

        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (this.type === 'rectangle' || this.type === 'tall') {
            ctx.rect(this.x, this.y + offsetY, this.width, this.height);
        } else if (this.type === 'trapezoid') {
            ctx.moveTo(this.x, this.y + this.height + offsetY);
            ctx.lineTo(this.x + this.topWidthOffset, this.y + offsetY);
            ctx.lineTo(this.x + this.width - this.topWidthOffset, this.y + offsetY);
            ctx.lineTo(this.x + this.width, this.y + this.height + offsetY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

// ==========================================
// 게임 초기화 및 진행
// ==========================================
function blockInitGame() {
    blockScore = 0;
    blockStack = [];
    blockCameraY = 0;
    blockTargetCameraY = 0;
    blockIsCollapsing = false;
    blockGameOverCalled = false;

    if (blockScoreEl) blockScoreEl.innerText = blockScore;

    // 고정 바닥판
    blockStack.push(new BlockPiece(120, BLOCK_CANVAS_HEIGHT - 30, 160, 30, '#444', 0, 0, 'rectangle'));

    blockSpawnNextBlock();
    blockGameActive = true;
    if (blockOverlay) blockOverlay.style.display = 'none';
    if (blockFinalScoreEl) {
        blockFinalScoreEl.style.display = 'none';
        blockFinalScoreEl.innerHTML = '';
    }
    lastBlockUploadedId = null; // 이전 판 하이라이트 초기화
}

function blockSpawnNextBlock() {
    // 신규
    const randomType = ['rectangle', 'trapezoid', 'tall'][Math.floor(Math.random() * 3)];
    const randomWidth = randomType === 'tall'
        ? Math.floor(Math.random() * (50 - 30 + 1)) + 30
        : Math.floor(Math.random() * (150 - 60 + 1)) + 60;
    const randomHeight = randomType === 'tall'
        ? Math.floor(Math.random() * (70 - 50 + 1)) + 50
        : Math.floor(Math.random() * (50 - 15 + 1)) + 15;
    const randomColor = blockColors[Math.floor(Math.random() * blockColors.length)];
    const startX = Math.random() < 0.5 ? -randomWidth : BLOCK_CANVAS_WIDTH;
    const dir = startX < 0 ? 1 : -1;

    // ── 수정 구간 ───────────────────────────────────────
    // 현재 스택의 가장 위(마지막) 블록을 가져옵니다.
    const topBlock = blockStack[blockStack.length - 1];

    blockCurrentBlock = new BlockPiece(
        startX,
        topBlock.y - randomHeight, // 괄호 안을 topBlock.y로 수정
        randomWidth,
        randomHeight,
        randomColor,
        BLOCK_GAME_SPEED,
        dir,
        randomType
    );
    // ──────────────────────────────────────────────────

    if (BLOCK_CANVAS_HEIGHT - blockCurrentBlock.y > 250) {
        blockTargetCameraY = (BLOCK_CANVAS_HEIGHT - 250) - blockCurrentBlock.y;
    }
}

function blockHandleDrop() {
    if (!blockGameActive || blockIsCollapsing) return;

    const topBlock = blockStack[blockStack.length - 1];
    const topSurface = topBlock.getTopSurfaceBounds();

    const hasOverlap = (blockCurrentBlock.x < topSurface.right) &&
        (blockCurrentBlock.x + blockCurrentBlock.width > topSurface.left);

    if (!hasOverlap) {
        const fallDir = (blockCurrentBlock.getCenter() > topBlock.getCenter()) ? "right" : "left";
        const pX = fallDir === "right" ? topSurface.right : topSurface.left;
        blockTriggerMultiCollapse(blockStack.length - 1, fallDir, pX);
        return;
    }

    blockStack.push(blockCurrentBlock);

    const balanceCheck = blockCheckStackStability();
    if (!balanceCheck.stable) {
        blockStack.pop();
        blockTriggerMultiCollapse(balanceCheck.breakIndex, balanceCheck.direction, balanceCheck.pivotX);
        return;
    }

    blockScore++;
    if (blockScoreEl) blockScoreEl.innerText = blockScore;
    blockSpawnNextBlock();
}

function blockCheckStackStability() {
    for (let i = 0; i < blockStack.length - 1; i++) {
        const supportBlock = blockStack[i];
        const supportSurface = supportBlock.getTopSurfaceBounds();

        let totalMass = 0;
        let weightedCenterSum = 0;

        for (let j = i + 1; j < blockStack.length; j++) {
            const upperBlock = blockStack[j];
            totalMass += upperBlock.mass;
            weightedCenterSum += upperBlock.getCenter() * upperBlock.mass;
        }

        const cog = weightedCenterSum / totalMass;

        if (cog < supportSurface.left) {
            return { stable: false, direction: "left", pivotX: supportSurface.left, breakIndex: i };
        } else if (cog > supportSurface.right) {
            return { stable: false, direction: "right", pivotX: supportSurface.right, breakIndex: i };
        }
    }
    return { stable: true };
}

function blockTriggerMultiCollapse(brokenIndex, mainDirection, initialPivotX) {
    blockGameActive = false;
    blockIsCollapsing = true;

    blockCameraY += 50;
    blockTargetCameraY = 0;

    const baseRotSpeed = mainDirection === "right" ? 0.02 : -0.02;

    blockCurrentBlock.isBreaking = true;
    blockCurrentBlock.fallSpeed = baseRotSpeed * 1.2;
    blockCurrentBlock.pivotX = blockCurrentBlock.getCenter();
    blockCurrentBlock.pivotY = blockCurrentBlock.y + blockCurrentBlock.height / 2;

    for (let i = brokenIndex; i < blockStack.length; i++) {
        if (i === 0) continue;
        blockStack[i].isBreaking = true;
        const multiplier = 1 + (i - brokenIndex) * 0.2;
        blockStack[i].fallSpeed = baseRotSpeed * multiplier;
        blockStack[i].pivotX = blockStack[i].getCenter();
        blockStack[i].pivotY = blockStack[i].y + blockStack[i].height / 2;
    }

    const subAffectRange = Math.max(1, brokenIndex - 2);
    for (let i = subAffectRange; i < brokenIndex; i++) {
        blockStack[i].isBreaking = true;
        blockStack[i].fallSpeed = baseRotSpeed * 0.4;
        blockStack[i].pivotX = blockStack[i].getCenter();
        blockStack[i].pivotY = blockStack[i].y + blockStack[i].height / 2;
    }
}

function blockDrawBackgroundGrid(offsetY) {
    blockCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    blockCtx.lineWidth = 1;
    const startY = offsetY % 40;
    for (let y = startY; y < BLOCK_CANVAS_HEIGHT; y += 40) {
        blockCtx.beginPath();
        blockCtx.moveTo(0, y);
        blockCtx.lineTo(BLOCK_CANVAS_WIDTH, y);
        blockCtx.stroke();
    }
    for (let x = 40; x < BLOCK_CANVAS_WIDTH; x += 40) {
        blockCtx.beginPath();
        blockCtx.moveTo(x, 0);
        blockCtx.lineTo(x, BLOCK_CANVAS_HEIGHT);
        blockCtx.stroke();
    }
}

// ==========================================
// 게임 오버 + 랭킹 저장
// ==========================================
async function blockGameOver() {
    blockIsCollapsing = false;

    if (blockTitleEl) blockTitleEl.innerText = "WEIGHT CRASHED!";
    if (blockStartBtn) blockStartBtn.innerText = "다시 도전";
    if (blockOverlay) blockOverlay.style.display = 'flex';

    if (blockFinalScoreEl) {
        blockFinalScoreEl.innerHTML = '';
        blockFinalScoreEl.style.display = 'block';
    }

    if (blockScore <= 0) {
        loadBlockRankings();
        return;
    }

    await handleBlockGameOver(blockScore);
}

async function handleBlockGameOver(score) {
    if (!initSupabase()) return;

    // 1. 순위 계산
    const { data: allData } = await window._supabase
        .from('block_rank')
        .select('score')
        .order('score', { ascending: false });

    const top10 = allData ? allData.slice(0, 10) : [];
    const rank = top10.length < 10 ? allData.filter(r => r.score > score).length + 1 : top10.filter(r => r.score > score).length + 1;
    // 2. 닉네임 분기
    const doSave = async (nickname) => {
        await blockSaveAndShowRank(score, nickname);

        // 3. suddenwinner 조건 — 저장 완료 후 이동
        const threshold = (typeof BLOCK_THRESHOLD !== 'undefined') ? BLOCK_THRESHOLD : 9;
        if (score >= threshold) {
            sessionStorage.setItem('block_celebration_verified', 'true');
            sessionStorage.setItem('block_celebration_score', String(score));
            window.location.href = `suddenwinner.html?game=block&score=${score}`;
        }
    };

    if (currentUsername) {
        await doSave(currentUsername);
    } else if (rank <= 10) {
        showNicknameModal(score, rank, doSave);
    } else {
        await doSave('미입력');
    }
}

async function blockSaveAndShowRank(score, nickname) {
    // ① 순위 먼저 표시
    const rankPromise = loadBlockRankings(score);

    // ② 저장 (타임락 체크)
    if (canSaveBlockScore() && initSupabase()) {
        try {
            let token = null;
            if (typeof generateVerificationToken === 'function') {
                token = generateVerificationToken(nickname, score);
            } else if (typeof generateVerificationHash === 'function') {
                token = generateVerificationHash(nickname, score);
            }

            const { data: insertData, error } = await window._supabase
                .from('block_rank')
                .insert([{
                    nickname: nickname,
                    score: score,
                    verification_token: token
                }])
                .select();

            if (error) throw error;
            if (insertData && insertData.length > 0) {
                lastBlockUploadedId = String(insertData[0].id);
            }
            markBlockSaveTime();

            // 저장 후 하이라이트 반영
            loadBlockRankings(score);
        } catch (err) {
            console.warn('[block_rank 저장 실패]', err);
        }
    } else {
        // 타임락으로 저장 스킵해도 순위는 표시
        loadBlockRankings(score);
    }

    await rankPromise;
}

// ==========================================
// 랭킹 로드 (Top 10 + 내 순위)
// ==========================================
async function loadBlockRankings(myScore = null) {
    const list = document.getElementById('blockRankingList');
    if (!list) return;
    if (!initSupabase()) {
        list.innerHTML = '<li>랭킹을 불러올 수 없습니다.</li>';
        return;
    }

    try {
        // ── 전체 1번만 조회 (Top10 표시 + 내 순위 계산 동시 처리) ──
        const { data, error } = await window._supabase
            .from('block_rank')
            .select('id, nickname, score, created_at')
            .order('score', { ascending: false });

        if (error) throw error;

        list.innerHTML = '';

        if (!data || data.length === 0) {
            list.innerHTML = '<li>아직 기록이 없습니다. 첫 번째 도전자가 되세요!</li>';
            return;
        }

        // Top 10만 화면에 표시
        data.slice(0, 10).forEach((row, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
            const dateString = formatBlockDate(row.created_at);
            const li = document.createElement('li');
            const isMyNew = lastBlockUploadedId && String(row.id) === lastBlockUploadedId;

            if (isMyNew) {
                li.style.cssText = 'background-color:#e6f4ea;color:#137333;font-weight:bold;border-radius:5px;padding:6px 10px;margin:4px 0;transition:all 0.5s ease;';
                li.innerHTML = `${medal} <span>${row.nickname}</span> — ${row.score}층 <span style="font-size:0.85rem;color:#137333;float:right;">(${dateString})</span>`;
            } else {
                li.innerHTML = `${medal} <span>${row.nickname}</span> — ${row.score}층 <span style="font-size:0.85rem;color:#888;float:right;">(${dateString})</span>`;
            }
            list.appendChild(li);
        });

        // 내 순위 계산 (같은 data로 바로 처리, 추가 쿼리 없음)
        if (myScore !== null) {
            const myRank = data.filter(r => r.score > myScore).length + 1;
            const scoreDisplay = document.getElementById('block-score-display');
            if (scoreDisplay) {
                // 점수 + 순위 한 번에 세팅 (깜빡임 없음)
                scoreDisplay.innerHTML = `쌓은 층수: <strong>${myScore}</strong>층 <span style="font-size:1rem; color:#007bff; margin-left:8px;">🏅 전체 ${myRank}위</span>`;
                scoreDisplay.style.display = 'block';
            }
        }
    } catch (err) {
        console.warn('[block_rank 로드 실패]', err);
        list.innerHTML = '<li>랭킹을 불러오는 중 오류가 발생했습니다.</li>';
    }
}

// ==========================================
// 애니메이션 루프
// ==========================================
function blockAnimate() {
    if (!blockCtx) return;

    blockCtx.clearRect(0, 0, BLOCK_CANVAS_WIDTH, BLOCK_CANVAS_HEIGHT);

    if (blockCameraY !== blockTargetCameraY) {
        blockCameraY += (blockTargetCameraY - blockCameraY) * 0.04;
        if (Math.abs(blockCameraY - blockTargetCameraY) < 0.4) {
            blockCameraY = blockTargetCameraY;
        }
    }

    blockDrawBackgroundGrid(blockCameraY);

    if (blockIsCollapsing) {
        let allOutOffScreen = true;

        if (blockCurrentBlock.isBreaking) {
            blockCurrentBlock.velY += 0.3;
            blockCurrentBlock.pivotY += blockCurrentBlock.velY;
            blockCurrentBlock.pivotX += blockCurrentBlock.fallSpeed * 15;
            blockCurrentBlock.fallAngle += blockCurrentBlock.fallSpeed;
            if (blockCurrentBlock.pivotY + blockCameraY < BLOCK_CANVAS_HEIGHT + 100) allOutOffScreen = false;
        }

        blockStack.forEach(block => {
            if (block.isBreaking) {
                block.velY += 0.3;
                block.pivotY += block.velY;
                block.pivotX += block.fallSpeed * 15;
                block.fallAngle += block.fallSpeed;
                if (block.pivotY + blockCameraY < BLOCK_CANVAS_HEIGHT + 100) allOutOffScreen = false;

                blockCtx.save();
                blockCtx.translate(block.pivotX, block.pivotY + blockCameraY);
                blockCtx.rotate(block.fallAngle);
                block.drawAtOrigin(blockCtx);
                blockCtx.restore();
            } else {
                block.drawNormal(blockCtx, blockCameraY);
            }
        });

        if (blockCurrentBlock.isBreaking) {
            blockCtx.save();
            blockCtx.translate(blockCurrentBlock.pivotX, blockCurrentBlock.pivotY + blockCameraY);
            blockCtx.rotate(blockCurrentBlock.fallAngle);
            blockCurrentBlock.drawAtOrigin(blockCtx);
            blockCtx.restore();
        }

        if (allOutOffScreen && blockCameraY === 0 && !blockGameOverCalled) {
            blockGameOverCalled = true;
            blockGameOver();
        }
    } else {
        blockStack.forEach(block => block.drawNormal(blockCtx, blockCameraY));
        if (blockGameActive) {
            blockCurrentBlock.update();
            blockCurrentBlock.drawNormal(blockCtx, blockCameraY);
        }
    }

    requestAnimationFrame(blockAnimate);
}

// ==========================================
// 초기화 (window load 시 호출)
// ==========================================
function initBlockGame() {
    blockCanvas = document.getElementById('blockCanvas');
    blockScoreEl = document.getElementById('block-score');
    blockOverlay = document.getElementById('block-overlay');
    blockStartBtn = document.getElementById('block-start-btn');
    blockTitleEl = document.getElementById('block-title');
    blockFinalScoreEl = document.getElementById('block-score-display');

    if (!blockCanvas) return;
    blockCtx = blockCanvas.getContext('2d');

    // 시작 버튼
    blockStartBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        blockInitGame();
    });

    // 스페이스바
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            const blockTab = document.getElementById('content-block');
            if (blockTab && blockTab.style.display !== 'none') {
                e.preventDefault();
                blockHandleDrop();
            }
        }
    });

    // 캔버스 클릭/터치
    blockCanvas.addEventListener('click', () => blockHandleDrop());
    blockCanvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        blockHandleDrop();
    }, { passive: false });

    blockAnimate();
    loadBlockRankings();
}

window.addEventListener('load', () => {
    initBlockGame();
});
// ── 공통 날짜 포맷: yy/mm/dd hh:mm:ss (KST) ──
function formatBlockDate(isoString) {
    const d = new Date(isoString);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const yy = String(kst.getUTCFullYear()).slice(2);
    const mo = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kst.getUTCDate()).padStart(2, '0');
    const hh = String(kst.getUTCHours()).padStart(2, '0');
    const mm = String(kst.getUTCMinutes()).padStart(2, '0');
    const ss = String(kst.getUTCSeconds()).padStart(2, '0');
    return `${yy}/${mo}/${dd} ${hh}:${mm}:${ss}`;
}