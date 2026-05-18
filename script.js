// ==========================================
// 0. Supabase 환경변수 직접 주입 (캐시 박살용)
// ==========================================
const supabaseUrl = 'https://zqocsmfeigllzqladkqj.supabase.co'; // 🌟 진짜 ID 적용! (lyzq 아님)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk';

// 전역 변수 _supabase를 여기서 직접 만들어버립니다.
window._supabase = supabase.createClient(supabaseUrl, supabaseKey);


// ==========================================
// 1. 초기 설정 및 글로벌 변수 (여기서부터 기존 코드 시작...)
// ==========================================
let currentUsername = "";
// ... 아래 기존 코드는 그대로 두시면 됩니다!
// ==========================================
// 1. 초기 설정 및 글로벌 변수
// ==========================================
let currentUsername = "";
let rpsStreak = 0; // 가위바위보 연승 기록

// 원 그리기 게임용 변수들
const canvas = document.getElementById('drawCanvas');
let ctx = null;
if (canvas) ctx = canvas.getContext('2d');

let isDrawing = false;
let points = []; // 사용자가 그린 점들의 좌표 배열

// 페이지가 로드되면 랭킹보드들을 먼저 가져옵니다.
window.addEventListener('DOMContentLoaded', () => {
    fetchGlobalRankings();
    fetchCircleRankings();
    if (canvas) resizeCanvas();
});

window.addEventListener('resize', () => {
    if (canvas && document.getElementById('content-circle').style.display !== 'none') {
        resizeCanvas();
    }
});


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
    
    // 로그인 창 숨기고 게임 영역 보여주기
    document.getElementById('user-setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    // 원 그리기 캔버스 크기 최종 맞춤
    setTimeout(resizeCanvas, 50);
}

// 가위바위보 <-> 원 그리기 탭 전환 함수
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
        // 원 그리기 화면으로 전환될 때 캔버스 크기를 다시 한 번 올바르게 잡아줍니다.
        resizeCanvas();
    }
}


// ==========================================
// 3. 게임 1: 가위바위보 로직 & Supabase 연동
// ==========================================
async function playGame(userChoice) {
    if (!currentUsername) {
        alert("시작하기 버튼을 먼저 눌러주세요!");
        return;
    }

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
        
        // 연승할 때마다 Supabase 실시간 업데이트
        await uploadRpsScore(rpsStreak);
    } else {
        result = `졌습니다... 😭\n최종 기록: ${rpsStreak}연승\n\n다시 도전해 보세요!`;
        rpsStreak = 0;
        document.getElementById('user-score').innerText = rpsStreak;
    }

    document.getElementById('result-text').innerText = 
        `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
}

// 가위바위보 점수 업로드
async function uploadRpsScore(score) {
    try {
        const { data, error } = await _supabase
            .from('rankings')
            .insert([{ username: currentUsername, score: score }]);
        
        if (error) throw error;
        fetchGlobalRankings(); // 랭킹 새로고침
    } catch (err) {
        console.error("가위바위보 점수 업로드 실패:", err);
    }
}

// 가위바위보 랭킹 페치 및 한국 시간 표시
async function fetchGlobalRankings() {
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
            rankingList.innerHTML = '<li>아직 등록된 랭킹이 없습니다. 첫 주인공이 되어보세요!</li>';
            return;
        }

        data.forEach((player, index) => {
            const date = new Date(player.created_at);
            // 한국 시간 포맷 변환 마법 코드 적용!
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
// 4. 게임 2: 원 그리기 로직 & Supabase 연동
// ==========================================

// 캔버스 사이즈 조절 및 초기화
function resizeCanvas() {
    if (!canvas) return;
    // 모바일과 PC 화면 비율을 고려해 유연하게 조절
    const containerWidth = document.getElementById('game-area').clientWidth;
    canvas.width = Math.min(containerWidth, 500); 
    canvas.height = canvas.width * 0.8; // 4:3 황금비율
    clearCanvas();
}

function clearCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- 이벤트 리스너 마우스 및 터치 등록 ---
if (canvas) {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e.touches[0]); });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); });

    window.addEventListener('mouseup', stopDrawing);
    window.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
    if (!currentUsername) return; // 로그인 안 되어 있으면 드로잉 작동 금지
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
    ctx.strokeStyle = '#28a745'; // 싱그러운 초록색 선
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

    // 점 개수가 너무 적으면 무효 처리
    if (points.length < 15) {
        document.getElementById('message').innerText = "너무 짧게 그렸습니다. 다시 쭉 원을 그려주세요.";
        return;
    }

    calculateCircleScore();
}

// ⭕ 원의 유사도(정확도) 계산 수학 알고리즘
async function calculateCircleScore() {
    const scoreDisplay = document.getElementById('score-display');
    const messageDisplay = document.getElementById('message');

    // 1. 무게 중심 계산
    let sumX = 0, sumY = 0;
    points.forEach(p => { sumX += p.x; sumY += p.y; });
    const centerX = sumX / points.length;
    const centerY = sumY / points.length;

    // 2. 중심점으로부터의 평균 반지름 계산
    let totalRadius = 0;
    const distances = points.map(p => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        totalRadius += dist;
        return dist;
    });
    const avgRadius = totalRadius / points.length;

    // 찌그러진 초소형 감자 필터링
    if (avgRadius < 20) {
        messageDisplay.innerText = "원이 너무 작아요! 크게 시원하게 그려보세요!";
        return;
    }

    // 3. 오차(표준편차) 계산
    let varianceSum = 0;
    distances.forEach(d => { varianceSum += Math.pow(d - avgRadius, 2); });
    const standardDeviation = Math.sqrt(varianceSum / points.length);

    // 4. 시작점과 끝점이 예쁘게 맞닿았는지 체크
    const startP = points[0];
    const endP = points[points.length - 1];
    const gap = Math.sqrt(Math.pow(startP.x - endP.x, 2) + Math.pow(startP.y - endP.y, 2));
    
    // 5. 점수화 공식 가동
    const errorRatio = standardDeviation / avgRadius;
    let shapeScore = (1 - errorRatio * 2) * 100;
    const gapPenalty = (gap / avgRadius) * 25; 
    
    let finalScore = shapeScore - gapPenalty;
    finalScore = Math.max(0, Math.min(100, finalScore));
    finalScore = Math.round(finalScore * 10) / 10; // 소수점 첫째짜리까지 표현 (예: 98.4%)

    // 점수 표시 및 통통 팅기는 애니메이션 효과
    scoreDisplay.innerText = `${finalScore}%`;
    scoreDisplay.style.transform = 'scale(1.2)';
    setTimeout(() => { scoreDisplay.style.transform = 'scale(1)'; }, 200);

    // 점수별 리액션 멘트 출력
    if (finalScore >= 90) {
        messageDisplay.innerText = "이것은 다빈치의 환생인가요? 대단합니다! 🎉";
    } else if (finalScore >= 75) {
        messageDisplay.innerText = "와우, 제법 훌륭하고 둥근 원이네요! 👍";
    } else if (finalScore >= 50) {
        messageDisplay.innerText = "동그라미라기보단 타원에 가깝군요. 🙂";
    } else {
        messageDisplay.innerText = "찌그러진 감자 발견! 🥔 다시 그려봐요!";
    }

    // 🎯 원 그리기 최고 점수를 Supabase 새 테이블에 기록!
    await uploadCircleScore(finalScore);
}

// 원 그리기 점수 업로드 함수
async function uploadCircleScore(score) {
    try {
        const { data, error } = await _supabase
            .from('circle_rankings') // 아까 추가한 두 번째 새 테이블 이름
            .insert([{ username: currentUsername, score: score }]);
        
        if (error) throw error;
        fetchCircleRankings(); // 명예의 전당 새로고침
    } catch (err) {
        console.error("원 그리기 점수 업로드 실패:", err);
    }
}

// 원 그리기 명예의 전당 페치 및 한국 시간 표시
async function fetchCircleRankings() {
    try {
        const { data, error } = await _supabase
            .from('circle_rankings')
            .select('*')
            .order('score', { ascending: false }) // 정확도 높은 순으로 1등부터 정렬
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
            // 소수점 첫째자리 정확도 출력 (%단위)
            li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🎯 정확도 <span>${player.score}%</span> <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            circleRankingList.appendChild(li);
        });
    } catch (err) {
        console.error("원 그리기 랭킹 불러오기 실패:", err);
    }
}