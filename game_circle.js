const canvas = document.getElementById('drawCanvas');
let ctx = canvas ? canvas.getContext('2d') : null;
let isDrawing = false;
let points = []; 

let lastUploadedId = null;

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

    drawPerfectGuideCircle(centerX, centerY, avgRadius);

    await uploadCircleScore(finalScore);

    if (finalScore >= 95.0) {
        sessionStorage.setItem('circle_celebration_verified', 'true');
        sessionStorage.setItem('circle_celebration_score', finalScore.toString());

        setTimeout(() => {
            window.location.href = `suddenwinner.html?score=${finalScore}`;
        }, 800); 
    }
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

async function uploadCircleScore(score) {
    if (!initSupabase() || score < 0 || score > 100) return;
    try {
        // 🔒 [오타 수정 완료] 정의되지 않은 가짜 명찰을 진짜 보안 엔진 이름인 generateVerificationToken으로 매핑했습니다.
        const verificationHash = generateVerificationToken(currentUsername, score);
        
        // window._supabase 객체를 조준하여 랭킹 데이터 안전 전송
        const { data, error } = await window._supabase.from('circle_rankings').insert([{ 
            username: currentUsername, score: score, verification_token: verificationHash 
        }]).select();
        
        if (error) throw error;
        if (data && data.length > 0) { lastUploadedId = data[0].id; }
        if (typeof lockCircleSubmitTime === 'function') lockCircleSubmitTime();
        fetchCircleRankings();
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
            const noDataLi = document.createElement('li');
            noDataLi.innerText = '기록이 없습니다.';
            circleRankingList.appendChild(noDataLi);
            return;
        }
        
        data.forEach((player, index) => {
            const dateString = new Date(player.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
            const li = document.createElement('li');
            
            if (lastUploadedId && player.id === lastUploadedId) {
                li.style.backgroundColor = '#e6f4ea'; 
                li.style.color = '#137333';
                li.style.fontWeight = 'bold';
                li.style.borderRadius = '5px';
                li.style.padding = '4px 8px';
                li.style.transition = 'all 0.5s ease';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🎯 정확도 <span>${player.score}%</span> <span style="font-size:0.85rem; color:#137333; float:right;">(${dateString})</span>`;
            } else {
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🎯 정확도 <span>${player.score}%</span> <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            }
            circleRankingList.appendChild(li);
        });
    } catch (err) { 
        console.error("원 랭킹 로드 실패:", err); 
    }
}