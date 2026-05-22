// ==========================================
// 0. Supabase 환경변수 직접 주입
// ==========================================
const supabaseUrl = 'https://zqocsmfeigllzqladkqj.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk';

let currentUsername = "";
let evaluationMents = []; // 멘트 저장 배열

function initSupabase() {
    if (window._supabase) return true;
    if (typeof supabase !== 'undefined') {
        window._supabase = supabase.createClient(supabaseUrl, supabaseKey);
        return true;
    }
    return false;
}

// ==========================================
// main.js 파일의 초기화 이벤트 부분을 아래로 교체해 주세요!
// ==========================================

window.addEventListener('load', async () => {
    // 1. Supabase 백엔드 먼저 연결
    initSupabase();
    
    // 2. ment.json 멘트 파일 로드
    await loadMentsFromFile(); 
    
    // 3. [에러 해결 포인트] 각 함수가 존재하는지 눈으로 확인하고 안전하게 실행!
    if (typeof fetchGlobalRankings === 'function') {
        fetchGlobalRankings();
    } else {
        console.log("💡 아직 game_rps.js 로딩 전이거나 함수를 찾을 수 없습니다.");
    }
    
    if (typeof fetchCircleRankings === 'function') {
        fetchCircleRankings();
    } else {
        console.log("💡 아직 game_circle.js 로딩 전이거나 함수를 찾을 수 없습니다.");
    }
    
    if (typeof initCircleCanvas === 'function') {
        initCircleCanvas();
    }
});

// 🌟 외부 ment.json 파일을 가져오는 안전한 함수
async function loadMentsFromFile() {
    try {
        const response = await fetch('ment.json');
        evaluationMents = await response.json();
    } catch (err) {
        console.error("멘트 파일 로드 실패, 기본값으로 대체합니다:", err);
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

    if (typeof resizeCanvas === 'function') {
        setTimeout(resizeCanvas, 50);
    }
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
// main.js 맨 아래에 추가
document.getElementById('main-title').addEventListener('click', function() {
    // 1. 모든 게임 화면(컨텐츠) 영역을 숨깁니다.
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => {
        content.style.display = 'none';
    });

    // 2. 닉네임 입력 화면(로그인 화면)을 보여줍니다.
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
        loginScreen.style.display = 'block';
    }

    // 3. 선택 사항: 현재 닉네임 변수를 초기화하여 완전히 처음 상태로 만듭니다.
    currentUsername = null;
    
    // 4. 입력창이 있다면 닉네임 입력칸을 비워줍니다.
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) {
        nicknameInput.value = '';
        nicknameInput.focus();
    }
    
    console.log("메인 화면으로 이동했습니다.");
});