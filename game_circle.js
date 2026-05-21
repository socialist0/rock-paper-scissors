const canvas = document.getElementById('drawCanvas');
let ctx = canvas ? canvas.getContext('2d') : null;
let isDrawing = false;
let points = []; 

function initCircleCanvas() {
    if (!canvas) return;
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
    if (!currentUsername) return;
    isDrawing = true; points = []; clearCanvas();
    document.getElementById('score-display').innerText = "0%";
    document.getElementById('message').innerText = "정성을 다해 원을 그리는 중...";

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    points.push({ x, y });
    
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#28a745';
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
    if (!canSubmitCircleScore()) return;
    calculateCircleScore();
}

async function calculateCircleScore() {
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

    const gap = Math.sqrt(Math.pow(points[0].x - points[points.length-1].x, 2) + Math.pow(points[0].y - points[points.length-1].y, 2));
    
    let shapeScore = (1 - (standardDeviation / avgRadius) * 2) * 100;
    const gapPenalty = (gap / avgRadius) * 25;
    const maxErrorPenalty = (maxError / avgRadius) * 40; 
    
    let finalScore = Math.max(0, Math.min(100, shapeScore - gapPenalty - maxErrorPenalty - smoothnessPenalty));
    finalScore = Math.round(finalScore * 10) / 10;

    scoreDisplay.innerText = `${finalScore}%`;
    const match = evaluationMents.find(m => finalScore <= m.max && finalScore >= m.min);
    messageDisplay.innerText = match ? match.text : "훌륭한 원입니다!";

    await uploadCircleScore(finalScore);
}

async function uploadCircleScore(score) {
    if (!initSupabase() || score < 0 || score > 100) return;
    try {
        const verificationHash = await generateVerificationHash(currentUsername, score);
        const { error } = await _supabase.from('circle_rankings').insert([{ 
            username: currentUsername, score: score, verification_token: verificationHash 
        }]);
        if (error) throw error;
        lockCircleSubmitTime();
        fetchCircleRankings();
    } catch (err) { console.error("원 그리기 업로드 실패:", err); }
}

async function fetchCircleRankings() {
    if (!initSupabase()) return;
    try {
        const { data, error } = await _supabase.from('circle_rankings').select('*').order('score', { ascending: false }).limit(10);
        if (error) throw error;
        const circleRankingList = document.getElementById('circleRankingList');
        circleRankingList.innerHTML = data.length === 0 ? '<li>기록이 없습니다.</li>' : '';
        data.forEach((player, index) => {
            const dateString = new Date(player.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
            const li = document.createElement('li');
            li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🎯 정확도 <span>${player.score}%</span> <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            circleRankingList.appendChild(li);
        });
    } catch (err) { console.error("원 랭킹 로드 실패:", err); }
}