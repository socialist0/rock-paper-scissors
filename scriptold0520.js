// ==========================================
// 0. Supabase 환경변수 직접 주입
// ==========================================
const supabaseUrl = 'https://zqocsmfeigllzqladkqj.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk';

function initSupabase() {
    if (window._supabase) return true;
    if (typeof supabase !== 'undefined') {
        window._supabase = supabase.createClient(supabaseUrl, supabaseKey);
        return true;
    }
    return false;
}

// ==========================================
// 1. 초기 설정 및 글로벌 변수
// ==========================================
let currentUsername = "";
let rpsStreak = 0; 
let evaluationMents = []; // 🌟 ment.json에서 다운로드한 멘트가 임시 저장될 배열 공간 (렉 방지용 캐시)

const canvas = document.getElementById('drawCanvas');
let ctx = null;
if (canvas) ctx = canvas.getContext('2d');

let isDrawing = false;
let points = []; 

// 페이지가 로드되면 실행되는 초기화 이벤트
window.addEventListener('DOMContentLoaded', async () => {
    initSupabase();
    await loadMentsFromFile(); // 🌟 렉이 전혀 없도록 켜지자마자 멘트 파일 미리 로딩!
    fetchGlobalRankings();
    fetchCircleRankings();
    if (canvas) resizeCanvas();
});

window.addEventListener('resize', () => {
    if (canvas && document.getElementById('content-circle').style.display !== 'none') {
        resizeCanvas();
    }
});

// 🌟 외부 ment.json 파일을 비동기로 가져와 메모리에 올려두는 안전한 함수
async function loadMentsFromFile() {
    try {
        const response = await fetch('ment.json');
        evaluationMents = await response.json();
    } catch (err) {
        console.error("멘트 파일 로드 실패, 기본값으로 대체합니다:", err);
        // 혹시나 파일 로드 실패 시 작동할 비상용 최소 데이터 보루
        evaluationMents = [
            {max: 100, min: 80, text: "와우, 멋지고 완벽한 동그라미입니다! 👍"},
            {max: 79, min: 40, text: "제법 원 모양을 갖추었네요! 🙂"},
            {max: 39, min: 0, text: "찌그러진 감자 발견! 다시 그려봐요! 🥔"}
        ];
    }
}

// ==========================================
// 2. 닉네임 로그인 및 게임 선택 탭 시스템
// ==========================================
function saveUsername() {
    const input = document.getElementById('username-input');
    const username = input.value.trim();

    if (!username) {
        alert("닉네임을 입력해 주세요!");
        return;
    }

    currentUsername = username;
    document.getElementById('display-username').innerText = currentUsername;
    
    document.getElementById('user-setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    setTimeout(resizeCanvas, 50);
}

function switchGame(gameType) {
    const rpsContent = document.getElementById('content-rps');
    const circleContent = document.getElementById('content-circle');
    const rpsTab = document.getElementById('tab-rps');
    const circleTab = document.getElementById('tab-circle');

    if (gameType === 'rps') {
        rpsContent.style.display = 'flex';
        circleContent.style.display = 'none';
        rpsTab.classList.add('active');
        circleTab.classList.remove('active');
    } else {
        rpsContent.style.display = 'none';
        circleContent.style.display = 'flex';
        circleTab.classList.add('active');
        rpsTab.classList.remove('active');
        resizeCanvas();
    }
}

// ==========================================
// 3. 게임 1: 가위바위보 로직
// ==========================================
async function playGame(userChoice) {
    if (!currentUsername) {
        alert("시작하기 버튼을 먼저 눌러주세요!");
        return;
    }

    // ⏳ [보안 교체] 가위바위보 전용 1초 연속 도배 차단 필터 가동
    if (!canSubmitRpsScore()) return;

    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    const koreanChoices = { rock: '👊 주먹', paper: '🖐️ 보', scissors: '✌️ 가위' };
    let result = '';

    if (userChoice === computerChoice) {
        result = '무승부입니다! 🤝';
    } else if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        rpsStreak++;
        result = `이겼습니다! 🎉\n현재 ${rpsStreak}연승 중!`;
        document.getElementById('user-score').innerText = rpsStreak;
        
        await uploadRpsScore(rpsStreak);
    } else {
        result = `졌습니다... 😭\n최종 기록: ${rpsStreak}연승\n\n다시 도전해 보세요!`;
        rpsStreak = 0;
        document.getElementById('user-score').innerText = rpsStreak;
    }

    document.getElementById('result-text').innerText = 
        `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
}

async function uploadRpsScore(score) {
    if (!initSupabase()) return;

    // 🔒 [보안 추가] 치트 수치 1차 필터링 (가위바위보 비정상적 연승 차단)
    if (score < 0 || score > 100) {
        alert("비정상적인 스코어 조작이 감지되었습니다.");
        return;
    }

    try {
        // 🔒 [보안 추가] 무결성 검증용 해시 토큰 생성
        const verificationHash = await generateVerificationHash(currentUsername, score);

        // Supabase 서버로 전송할 때 데이터 위변조 방지 토큰 탑재
        const { data, error } = await _supabase
            .from('rankings')
            .insert([{ 
                username: currentUsername, 
                score: score,
                verification_token: verificationHash // 👈 추가된 보안 컬럼 반영
            }]);
        
        if (error) throw error;

        // ⏳ [보안 교체] 제출 성공 시 가위바위보 전용 1초 디바이스 타임 락 작동
        lockRpsSubmitTime();
        fetchGlobalRankings();
    } catch (err) {
        console.error("가위바위보 점수 업로드 실패:", err);
    }
}

async function fetchGlobalRankings() {
    if (!initSupabase()) return;
    try {
        const { data, error } = await _supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = '';

        if (data.length === 0) {
            rankingList.innerHTML = '<li>아직 등록된 랭킹이 없습니다.</li>';
            return;
        }

        data.forEach((player, index) => {
            const date = new Date(player.created_at);
            const dateString = date.toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            });

            const li = document.createElement('li');
            li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            rankingList.appendChild(li);
        });
    } catch (err) {
        console.error("가위바위보 랭킹 불러오기 실패:", err);
    }
}

// ==========================================
// 4. 게임 2: 원 그리기 로직 (20단계 멘트 시스템 내장)
// ==========================================
function resizeCanvas() {
    if (!canvas) return;
    const containerWidth = document.getElementById('game-area').clientWidth;
    canvas.width = Math.min(containerWidth, 500); 
    canvas.height = canvas.width * 0.8;
    clearCanvas();
}

function clearCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

if (canvas) {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e.touches[0]); });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); });

    window.addEventListener('mouseup', stopDrawing);
    window.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    if (!currentUsername) return;
    isDrawing = true;
    points = [];
    clearCanvas();
    document.getElementById('score-display').innerText = "0%";
    document.getElementById('message').innerText = "정성을 다해 원을 그리는 중...";

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    points.push({ x, y });
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#28a745';
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    points.push({ x, y });

    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;

    if (points.length < 15) {
        document.getElementById('message').innerText = "너무 짧게 그렸습니다. 다시 쭉 원을 그려주세요.";
        return;
    }

    // ⏳ [보안 교체] 원 그리기 전용 20초 연속 도배 차단 필터 가동
    if (!canSubmitCircleScore()) return;

    calculateCircleScore();
}

async function calculateCircleScore() {
    const scoreDisplay = document.getElementById('score-display');
    const messageDisplay = document.getElementById('message');

    // 1. 중심점 계산 (X, Y 좌표의 평균)
    let sumX = 0, sumY = 0;
    points.forEach(p => { sumX += p.x; sumY += p.y; });
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;

    // 2. 각 점과 중심점 사이의 거리(반지름) 계산 및 평균 반지름 도출
    let totalRadius = 0;
    const distances = points.map(p => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        totalRadius += dist;
        return dist;
    });
    const avgRadius = totalRadius / points.length;

    if (avgRadius < 20) {
        messageDisplay.innerText = "원이 너무 작아요! 크게 시원하게 그려보세요!";
        return;
    }

    // 3. 전체적인 모양의 일관성 계산 (표준편차)
    let varianceSum = 0;
    distances.forEach(d => { varianceSum += Math.pow(d - avgRadius, 2); });
    const standardDeviation = Math.sqrt(varianceSum / points.length);

    // 🔥 [새로 추가] 4. 가장 많이 튀어나오거나 들어간 곳(최대 오차) 찾기
    let maxError = 0;
    distances.forEach(d => {
        const currentError = Math.abs(d - avgRadius); // 평균 반지름과 현재 거리의 차이 (절대값)
        if (currentError > maxError) {
            maxError = currentError;
        }
    });

    // 5. 시작점과 끝점의 벌어진 틈새(Gap) 감점 계산
    const startP = points[0];
    const endP = points[points.length - 1];
    const gap = Math.sqrt(Math.pow(startP.x - endP.x, 2) + Math.pow(startP.y - endP.y, 2));
    
    // 6. 감점 시스템 계산 적용
    const errorRatio = standardDeviation / avgRadius;
    let shapeScore = (1 - errorRatio * 2) * 100; // 전체적인 찌그러짐 점수 (기본 100점 만점 페널티)
    
    const gapPenalty = (gap / avgRadius) * 25;   // 선이 안 맞물린 벌어진 틈 감점
    
    // 🔥 [새로 추가] 최대 오차에 의한 감점 (평균 반지름 대비 최대 오차 비율의 40%만큼 추가 페널티)
    const maxErrorRatio = maxError / avgRadius;
    const maxErrorPenalty = maxErrorRatio * 40; 
    
    // 최종 점수 조립
    let finalScore = shapeScore - gapPenalty - maxErrorPenalty;
    finalScore = Math.max(0, Math.min(100, finalScore)); // 0점~100점 사이로 고정
    finalScore = Math.round(finalScore * 10) / 10;       // 소수점 첫째짜리까지 반올림

    // 7. 화면에 점수 연출 출력
    scoreDisplay.innerText = `${finalScore}%`;
    scoreDisplay.style.transform = 'scale(1.2)';
    setTimeout(() => { scoreDisplay.style.transform = 'scale(1)'; }, 200);

    // 8. 미리 불러와 둔 JSON 멘트와 매칭
    const match = evaluationMents.find(m => finalScore <= m.max && finalScore >= m.min);
    messageDisplay.innerText = match ? match.text : "와우! 훌륭한 원입니다!";

    // 9. 데이터베이스 업로드
    await uploadCircleScore(finalScore);
}

async function uploadCircleScore(score) {
    if (!initSupabase()) return;

    // 🔒 [보안 추가] 치트 수치 1차 필터링 (원 그리기 점수 한계선 차단)
    if (score < 0 || score > 100) {
        alert("비정상적인 스코어 조작이 감지되었습니다.");
        return;
    }

    try {
        // 🔒 [보안 추가] 무결성 검증용 해시 토큰 생성
        const verificationHash = await generateVerificationHash(currentUsername, score);

        const { data, error } = await _supabase
            .from('circle_rankings') 
            .insert([{ 
                username: currentUsername, 
                score: score,
                verification_token: verificationHash // 👈 추가된 보안 컬럼 반영
            }]);
        
        if (error) throw error;

        // ⏳ [보안 교체] 제출 성공 시 원 그리기 전용 20초 디바이스 타임 락 작동
        lockCircleSubmitTime();
        fetchCircleRankings();
    } catch (err) {
        console.error("원 그리기 점수 업로드 실패:", err);
    }
}

async function fetchCircleRankings() {
    if (!initSupabase()) return;
    try {
        const { data, error } = await _supabase
            .from('circle_rankings')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        const circleRankingList = document.getElementById('circleRankingList');
        circleRankingList.innerHTML = '';

        if (data.length === 0) {
            circleRankingList.innerHTML = '<li>아직 등록된 명예의 전당 기록이 없습니다.</li>';
            return;
        }

        data.forEach((player, index) => {
            const date = new Date(player.created_at);
            const dateString = date.toLocaleString('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            });

            const li = document.createElement('li');
            li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🎯 정확도 <span>${player.score}%</span> <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            circleRankingList.appendChild(li);
        });
    } catch (err) {
        console.error("원 그리기 랭킹 불러오기 실패:", err);
    }
}