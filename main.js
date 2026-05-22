// ==========================================
// 0. Supabase 전역 객체 연동 (하드코딩 제거 완료)
// ==========================================
let currentUsername = "";
let evaluationMents = []; // 멘트 저장 배열

// 🌟 config.js에서 이미 생성된 window._supabase를 안전하게 연결하는 함수
function initSupabase() {
    // 1. window._supabase 전역 객체가 이미 메모리에 존재하는지 체크
    if (window._supabase) {
        // 기존 개별 게임 코드들과의 변수 호환성을 위해 local 전역 변수 _supabase에도 바인딩해 줍니다.
        if (typeof _supabase === 'undefined') {
            window._supabase = window._supabase;
        }
        return true;
    }
    
    console.error("⚠️ [에러] config.js 파일이 없거나 window._supabase 객체가 생성되지 않았습니다.");
    return false;
}

// ==========================================
// 1. 플랫폼 초기화 및 파일 프리로딩 이벤트
// ==========================================
window.addEventListener('load', async () => {
    // 1. config.js 기반의 Supabase 백엔드 먼저 상속 및 연결
    initSupabase();
    
    // 2. ment.json 멘트 파일 비동기 로드
    await loadMentsFromFile(); 
    
    // 3. 각 독립 게임 모듈 함수들이 존재하는지 검증 후 안전하게 실시간 데이터 렌더링!
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

// ==========================================
// 3. 글로벌 타이틀 내비게이션 ("잠시만 혹시...?") 이벤트
// ==========================================
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
            userSetup.style.display = 'block';
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