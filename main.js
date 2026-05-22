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
// main.js 맨 아래에 있는 기존 타이틀 클릭 이벤트를 이 코드로 깔끔하게 새로 교체해 주세요!
window.addEventListener('load', () => {
    const mainTitle = document.getElementById('main-title');
    
    mainTitle?.addEventListener('click', function() {
        // 1. 게임 플레이 구역(#game-area)을 통째로 안 보이게 숨깁니다.
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.style.display = 'none';
        }

        // 2. 닉네임을 입력하는 첫 화면(#user-setup)을 다시 눈에 보이게 켭니다!
        const userSetup = document.getElementById('user-setup');
        if (userSetup) {
            userSetup.style.display = 'block'; // 💡 index.html의 실제 ID인 user-setup과 매핑!
        }

        // 3. 현재 저장되어 있던 닉네임 변수를 초기화합니다.
        currentUsername = null;
        
        // 4. 입력창에 적혀있던 기존 닉네임을 지우고 바로 타이핑할 수 있게 포커스를 줍니다.
        const nicknameInput = document.getElementById('username-input');
        if (nicknameInput) {
            nicknameInput.value = '';
            nicknameInput.focus();
        }
        
        console.log("실제 메인 화면(user-setup)으로 부드럽게 이동 완료했습니다!");
    });
});