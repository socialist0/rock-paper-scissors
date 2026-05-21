// ==========================================
// 0. Supabase 환경변수 및 공통 글로벌 변수
// ==========================================
const supabaseUrl = 'https://zqocsmfeigllzqladkqj.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk';

let currentUsername = "";
let evaluationMents = []; // 원그리기 멘트 캐시용

function initSupabase() {
    if (window._supabase) return true;
    if (typeof supabase !== 'undefined') {
        window._supabase = supabase.createClient(supabaseUrl, supabaseKey);
        return true;
    }
    return false;
}

// 초기화 이벤트
window.addEventListener('DOMContentLoaded', async () => {
    initSupabase();
    await loadMentsFromFile(); 
    fetchGlobalRankings();  // game_rps.js에서 구현 예정
    fetchCircleRankings();  // game_circle.js에서 구현 예정
    
    // 원그리기 캔버스 초기화 유무 체크
    if (typeof initCircleCanvas === 'function') initCircleCanvas();
});

// 🌟 공통 함수: 멘트 파일 미리 로딩
async function loadMentsFromFile() {
    try {
        const response = await fetch('ment.json');
        evaluationMents = await response.json();
    } catch (err) {
        console.error("멘트 파일 로드 실패, 기본값 대체:", err);
        evaluationMents = [{max: 100, min: 0, text: "원을 그려보세요!"}];
    }
}

// 🌟 로그인 및 게임 전환 시스템
function saveUsername() {
    const input = document.getElementById('username-input');
    const username = input.value.trim();
    if (!username) { alert("닉네임을 입력해 주세요!"); return; }

    currentUsername = username;
    document.getElementById('display-username').innerText = currentUsername;
    document.getElementById('user-setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';

    if (typeof resizeCanvas === 'function') setTimeout(resizeCanvas, 50);
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
        if (typeof resizeCanvas === 'function') resizeCanvas();
    }
}