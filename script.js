// 1. 기존에 있던 URL, KEY, supabase 관련 선언을 모두 지우고 이 코드로 시작하세요.
const { createClient } = supabase; // html에서 불러온 supabase 라이브러리 사용
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY); 

// 변수 이름 앞에 '_'가 붙어있는지 꼭 확인하세요! 
// 만약 아래 코드에서 supabase.from()을 쓰고 있다면 _supabase.from()으로 바꿔야 합니다.

// 2. 게임 상태 변수
let userScore = 0;
let computerScore = 0;
let userStreak = 0;
let comStreak = 0;
let userHistory = []; 
let computerHistory = [];

// 2. 페이지 로드 시 실행되는 부분 수정
window.onload = async function() {
    console.log("페이지 로드 완료, 랭킹을 불러옵니다..."); // 확인용 로그
    
    // 랭킹 먼저 불러오기
    await fetchGlobalRankings(); 

    const savedName = localStorage.getItem('rps_username');
    if (savedName) {
        showGame(savedName);
    }
};

// 4. 닉네임 저장 및 화면 전환
function saveUsername() {
    const nameInput = document.getElementById('username-input');
    const name = nameInput.value.trim();
    if (name !== "") {
        localStorage.setItem('rps_username', name);
        showGame(name);
    } else {
        alert("닉네임을 입력해주세요!");
    }
}

function showGame(name) {
    document.getElementById('user-setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    
    // 환영 메시지에 닉네임 표시
    document.getElementById('display-username').textContent = name;
    
    // 점수판의 "나의 점수" 부분을 "닉네임의 점수"로 변경 (추가된 부분)
    document.getElementById('player-name-display').textContent = name;
    
    fetchGlobalRankings(); // 랭킹 불러오기
}

// 5. 가위바위보 로직
const choices = ['주먹', '보', '가위'];

function getComputerChoice() {
    const randomIndex = Math.floor(Math.random() * 3);
    return choices[randomIndex];
}

function judge(userChoice, computerChoice) {
    if (userChoice === computerChoice) return "비겼습니다! 🤝";
    if (
        (userChoice === '주먹' && computerChoice === '가위') ||
        (userChoice === '보' && computerChoice === '주먹') ||
        (userChoice === '가위' && computerChoice === '보')
    ) return "당신이 이겼습니다! 🎉";
    return "당신이 졌습니다... 😢";
}

// 6. 게임 실행
function playGame(userChoice) {
    const computer = getComputerChoice();
    const result = judge(userChoice, computer);

    if (result === "당신이 이겼습니다! 🎉") {
        userScore++;
        userStreak++;
        if (comStreak > 0) saveRanking(comStreak, 'computer');
        comStreak = 0;
        document.getElementById('user-score').textContent = userScore;
        document.getElementById('result-text').textContent = `축하합니다! 현재 ${userStreak}연승 중! 🎉`;
    } else if (result === "당신이 졌습니다... 😢") {
        computerScore++;
        comStreak++;
        if (userStreak > 0) saveRanking(userStreak, 'user');
        userStreak = 0;
        document.getElementById('computer-score').textContent = computerScore;
        document.getElementById('result-text').textContent = `컴퓨터가 승리! 현재 컴퓨터 ${comStreak}연승 중.. 🤖`;
    } else {
        document.getElementById('result-text').textContent = `비겼습니다! 연승 유지! (나: ${userStreak}, 컴: ${comStreak})`;
    }
}

// 7. 랭킹 시스템 (Supabase 연동)
async function saveRanking(streak, who) {
    if (who === 'user') {
        // 1. 내 로컬 기록 배열에 추가 및 정렬
        userHistory.push({ name: '나', streak: streak, created_at: new Date().toISOString() });
        userHistory.sort((a, b) => b.streak - a.streak); // 높은 순 정렬
        userHistory = userHistory.slice(0, 5); // Top 5만 남김
        
        // 2. 내 화면의 '나의 Top 5' 업데이트
        updateRankDisplay('user-rankings', userHistory);

        // 3. Supabase DB 저장 (전 세계 랭킹용)
        const username = localStorage.getItem('rps_username') || '익명';
        const { error } = await _supabase
            .from('rankings')
            .insert([{ name: username, streak: streak }]);

        if (!error) fetchGlobalRankings();
    } else {
        // 컴퓨터 기록 처리
        computerHistory.push({ name: '컴퓨터', streak: streak, created_at: new Date().toISOString() });
        computerHistory.sort((a, b) => b.streak - a.streak);
        computerHistory = computerHistory.slice(0, 5);
        updateRankDisplay('computer-rankings', computerHistory);
    }
}

async function fetchGlobalRankings() {
    const { data, error } = await _supabase
        .from('rankings')
        .select('*') // 모든 컬럼(created_at 포함)을 가져옴
        .order('streak', { ascending: false })
        .limit(5);
    // ... 이하 동일
}

function updateRankDisplay(elementId, ranks) {
    const listElement = document.getElementById(elementId);
    if (!listElement) return;
    
    listElement.innerHTML = ""; // 기존 내용 비우기

    if (!ranks || ranks.length === 0) {
        listElement.innerHTML = "<li>기록 없음</li>";
        return;
    }

    ranks.forEach((item, index) => {
        const li = document.createElement('li');
        
        // 데이터 형식에 따른 변수 설정 (객체면 속성값 사용, 숫자면 그대로 사용)
        const name = item.name || (elementId === 'user-rankings' ? '나' : '컴퓨터');
        const streak = item.streak !== undefined ? item.streak : item;
        
        // 날짜/시간 처리 (데이터에 없으면 현재 시간 표시)
        const timeValue = item.created_at || new Date().toISOString();
        const timeLabel = formatDateTime(timeValue);

        // 디자인 적용 (1등 강조)
        if (index === 0) {
            li.innerHTML = `
                <span style="color: #f1c40f; font-weight: bold;">🥇 ${index + 1}등. ${name}</span> 
                <span style="color: #e74c3c; font-weight: bold;">(${streak}연승)</span> 
                <small style="color: #888; margin-left: 10px;">${timeLabel}</small>
            `;
            li.style.backgroundColor = "#fff9db";
            li.style.padding = "5px";
            li.style.borderRadius = "5px";
        } else {
            li.innerHTML = `
                <strong>${index + 1}등. ${name}</strong> 
                <span style="color: #e74c3c;">(${streak}연승)</span> 
                <small style="color: #888; margin-left: 10px;">${timeLabel}</small>
            `;
        }
        
        li.style.marginBottom = "8px";
        listElement.appendChild(li);
    });
}
// 8. 이벤트 리스너
document.getElementById('rock').addEventListener('click', () => playGame('주먹'));
document.getElementById('paper').addEventListener('click', () => playGame('보'));
document.getElementById('scissors').addEventListener('click', () => playGame('가위'));

// 시간을 보기 좋게 변환하는 함수
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const y = String(date.getFullYear()).slice(-2); // 연도 뒤 2자리
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    
    return `${y}.${m}.${d} ${hh}:${mm}`;
}
