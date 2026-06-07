const canvas = document.getElementById('drawCanvas');
let ctx = canvas ? canvas.getContext('2d') : null;
let isDrawing = false;
let points = [];

let lastUploadedId = null;

// ── ment.json 로컬 캐시 ──
let circleMents = [];

async function loadCircleMents() {
    if (circleMents.length > 0) return;
    try {
        const res = await fetch('ment.json');
        if (!res.ok) throw new Error('ment.json fetch 실패');
        circleMents = await res.json();
    } catch (err) {
        console.warn('ment.json 로드 실패, 전역 evaluationMents 사용 시도:', err);
        if (Array.isArray(evaluationMents) && evaluationMents.length > 0) {
            circleMents = evaluationMents;
        }
    }
}

function initCircleCanvas() {
    if (!canvas) return;
    loadCircleMents();
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e.touches[0]); });
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); });
    window.addEventListener('mouseup', stopDrawing);
    window.addEventListener('touchend', stopDrawing);
    resizeCanvas();
}

window.addEventListener('resize', () => {
    if (canvas && document.getElementById('content-circle').style.display !== 'none') resizeCanvas();
});

function resizeCanvas() {
    if (!canvas) return;
    const containerWidth = document.getElementById('game-area').clientWidth;
    canvas.width = Math.min(containerWidth, 500);
    canvas.height = canvas.width * 0.8;
    clearCanvas();
}

function clearCanvas() { if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }

function startDrawing(e) {
    isDrawing = true; points = []; clearCanvas();
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay.innerText === '0%' || scoreDisplay.innerText === '') {
        scoreDisplay.innerText = "0%";
    }
    document.getElementById('message').innerText = "정성을 다해 원을 그리는 중...";

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    points.push({ x, y });

    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = 'blue';
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    points.push({ x, y });
    ctx.lineTo(x, y); ctx.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    if (points.length < 15) { document.getElementById('message').innerText = "너무 짧게 그렸습니다."; return; }
    if (typeof canSubmitCircleScore === 'function' && !canSubmitCircleScore()) return;
    calculateCircleScore();
}

async function calculateCircleScore() {
    await loadCircleMents();

    const scoreDisplay = document.getElementById('score-display');
    const messageDisplay = document.getElementById('message');

    let sumX = 0, sumY = 0;
    points.forEach(p => { sumX += p.x; sumY += p.y; });
    const centerX = sumX / points.length; const centerY = sumY / points.length;

    let totalRadius = 0;
    const distances = points.map(p => {
        const dist = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
        totalRadius += dist; return dist;
    });
    const avgRadius = totalRadius / points.length;
    if (avgRadius < 20) { messageDisplay.innerText = "원이 너무 작아요!"; return; }

    let varianceSum = 0;
    distances.forEach(d => { varianceSum += Math.pow(d - avgRadius, 2); });
    const standardDeviation = Math.sqrt(varianceSum / points.length);

    let maxError = 0;
    distances.forEach(d => { const err = Math.abs(d - avgRadius); if (err > maxError) maxError = err; });

    let roughnessSum = 0;
    for (let i = 1; i < distances.length; i++) { roughnessSum += Math.abs(distances[i] - distances[i - 1]); }
    const roughnessRatio = roughnessSum / (avgRadius * points.length);
    const smoothnessPenalty = roughnessRatio * 250;

    const gap = Math.sqrt(Math.pow(points[0].x - points[points.length - 1].x, 2) + Math.pow(points[0].y - points[points.length - 1].y, 2));

    let shapeScore = (1 - (standardDeviation / avgRadius) * 2) * 100;
    const gapPenalty = (gap / avgRadius) * 25;
    const maxErrorPenalty = (maxError / avgRadius) * 40;

    let finalScore = Math.max(0, Math.min(100, shapeScore - gapPenalty - maxErrorPenalty - smoothnessPenalty));
    finalScore = Math.round(finalScore * 10) / 10;

    scoreDisplay.innerText = `${finalScore}%`;
    const match = circleMents.find(m => finalScore <= m.max && finalScore >= m.min);
    messageDisplay.innerText = match ? match.text : "훌륭한 원입니다!";

    await handleCircleGameOver(finalScore);
    await replayDrawing(points, centerX, centerY, avgRadius);
}

// ==========================================
// 게임 오버 처리 — 닉네임 분기 포함
// ==========================================
async function handleCircleGameOver(score) {
    if (!initSupabase()) return;

    // 1. 순위 계산
    const { data: allData } = await window._supabase
        .from('circle_rankings')
        .select('score')
        .order('score', { ascending: false });

    const top10 = allData ? allData.slice(0, 10) : [];
    const rank = top10.length < 10 ? allData.filter(r => r.score > score).length + 1 : top10.filter(r => r.score > score).length + 1;
    // 2. 닉네임 분기
    const doSave = async (nickname) => {
        await uploadCircleScore(score, nickname);

        // 3. suddenwinner 조건 — 저장 완료 후 이동
        if (score >= CIRCLE_THRESHOLD) {
            sessionStorage.setItem('circle_celebration_verified', 'true');
            sessionStorage.setItem('circle_celebration_score', score.toString());
            setTimeout(() => {
                window.location.href = `suddenwinner.html?score=${score}`;
            }, 800);
        }
    };

    if (currentUsername) {
        await doSave(currentUsername);
    } else if (rank <= 10) {
        showNicknameModal(score, rank, doSave);
    } else {
        await doSave('outranker');
    }
}

async function showMyRankNextToScore() {
    if (!initSupabase() || !lastUploadedId) return;
    try {
        const { data: allData } = await window._supabase
            .from('circle_rankings')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false });

        if (!allData) return;
        const myRank = allData.findIndex(p => p.id === lastUploadedId);
        if (myRank === -1) return;

        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            const existing = document.getElementById('my-rank-badge');
            if (existing) existing.remove();

            const rankSpan = document.createElement('span');
            rankSpan.id = 'my-rank-badge';
            rankSpan.style.cssText = 'font-size:1.5rem;font-weight:bold;color:#b45309;margin-left:16px;';
            rankSpan.innerText = `오늘 ${myRank + 1}위`;
            scoreDisplay.appendChild(rankSpan);
        }
    } catch (err) {
        console.error("순위 표시 실패:", err);
    }
}

function replayDrawing(pts, cx, cy, radius) {
    const REPLAY_DURATION_MS = 2000;
    return new Promise(resolve => {
        clearCanvas();
        const totalPoints = pts.length;
        const interval = REPLAY_DURATION_MS / totalPoints;
        let i = 0;

        drawPerfectGuideCircle(cx, cy, radius);

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'blue';

        const timer = setInterval(() => {
            if (i >= totalPoints) { clearInterval(timer); resolve(); return; }
            ctx.lineTo(pts[i].x, pts[i].y);
            ctx.stroke();
            i++;
        }, interval);
    });
}

function drawPerfectGuideCircle(cx, cy, radius) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4d4d';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 77, 77, 0.8)';
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
}

async function uploadCircleScore(score, nickname) {
    if (!initSupabase() || score < 0 || score > 100) return;
    try {
        let verificationHash = "";
        if (typeof generateVerificationToken === 'function') {
            verificationHash = generateVerificationToken(nickname, score);
        } else if (typeof generateVerificationHash === 'function') {
            verificationHash = generateVerificationHash(nickname, score);
        }

        const { data, error } = await window._supabase.from('circle_rankings').insert([{
            username: nickname, score: score, verification_token: verificationHash
        }]).select();

        if (error) throw error;
        if (data && data.length > 0) { lastUploadedId = data[0].id; }
        if (typeof lockCircleSubmitTime === 'function') lockCircleSubmitTime();
        fetchCircleRankings();
        showMyRankNextToScore();
    } catch (err) {
        console.error("원 그리기 업로드 실패:", err);
    }
}

async function fetchCircleRankings() {
    if (!initSupabase()) return;
    try {
        const { data, error } = await window._supabase
            .from('circle_rankings')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        const circleRankingList = document.getElementById('circleRankingList');
        if (!circleRankingList) return;

        circleRankingList.innerHTML = '';

        if (data.length === 0) {
            circleRankingList.innerHTML = '<li>기록이 없습니다.</li>';
            return;
        }

        data.forEach((player, index) => {
            const dateString = formatBlockDate(player.created_at);
            const li = document.createElement('li');

            if (lastUploadedId && player.id === lastUploadedId) {
                li.style.cssText = 'background-color:#e6f4ea;color:#137333;font-weight:bold;border-radius:5px;padding:4px 8px;transition:all 0.5s ease;';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🎯 정확도 <span>${player.score}%</span> <span style="font-size:0.85rem;color:#137333;float:right;">(${dateString})</span>`;
            } else {
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🎯 정확도 <span>${player.score}%</span> <span style="font-size:0.85rem;color:#888;float:right;">(${dateString})</span>`;
            }
            circleRankingList.appendChild(li);
        });
    } catch (err) {
        console.error("원 랭킹 로드 실패:", err);
    }
}

function loadCircleRankings() {
    fetchCircleRankings();
}

window.addEventListener('load', () => {
    initCircleCanvas();
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