// 1. Supabase 클라이언트 초기화
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let winStreak = 0; // 현재 연승 기록

// 페이지 로드 시 실행
window.onload = async function() {
    console.log("페이지 로드 완료, 랭킹을 불러옵니다...");
    await fetchGlobalRankings();
};

// 랭킹 불러오기 함수
async function fetchGlobalRankings() {
    try {
        const { data, error } = await _supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        // HTML의 ID와 일치하도록 수정
        const rankingList = document.getElementById('rankingList');
        if (!rankingList) return;

        rankingList.innerHTML = ''; 

        if (!data || data.length === 0) {
            rankingList.innerHTML = '<li>아직 등록된 기록이 없습니다.</li>';
            return;
        }

// --- 이 부분을 아래와 같이 수정하세요 ---
        data.forEach((player, index) => {
            const li = document.createElement('li');
            
            // 💡 Supabase에서 가져온 날짜/시간 정보를 한국 시간 형식으로 예쁘게 바꿉니다.
            const date = new Date(player.created_at);
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

            // 💡 글자 맨 뒤에 괄호와 함께 날짜/시간(dateString)을 추가해 줍니다!
            li.textContent = `${index + 1}위: ${player.username} - ${player.score}연승 (${dateString})`;
            rankingList.appendChild(li);
        });
        // ----------------------------------------
    } catch (err) {
        console.error("랭킹 로드 실패:", err.message);
        const rankingList = document.getElementById('rankingList');
        if (rankingList) rankingList.innerHTML = '<li>랭킹을 불러올 수 없습니다.</li>';
    }
}

// 닉네임 저장 및 게임 시작
function saveUsername() {
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();
    
    if (!username) return alert("닉네임을 입력하세요!");

    document.getElementById('user-setup').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('display-username').textContent = username;
}

// 게임 로직 (가위바위보 실행)
async function playGame(userChoice) {
    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    const resultText = document.getElementById('result-text');
    const scoreDisplay = document.getElementById('user-score');

    const choiceNames = { 'rock': '✊주먹', 'paper': '✋보', 'scissors': '✌️가위' };
if (userChoice === computerChoice) {
        // 💡 textContent 대신 innerHTML 을 쓰고, \n 대신 <br> 태그를 넣었습니다!
        resultText.innerHTML = `비겼습니다! 🤝<br>연승이 유지됩니다. (컴퓨터: ${choiceNames[computerChoice]})`;
        scoreDisplay.textContent = winStreak;
                // 연승 유지 표시
        
    } else if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        winStreak++;
        resultText.textContent = `이겼습니다! 🎉 (컴퓨터: ${choiceNames[computerChoice]})`;
        scoreDisplay.textContent = winStreak;
        
    } else {
        // 💡 중간에 중복되었던 draw 조건은 지우고 바로 '졌을 때'로 넘어갑니다!
        resultText.textContent = `졌습니다... 💀 (컴퓨터: ${choiceNames[computerChoice]})`;
        // alert(`게임 종료! 최종 연승: ${winStreak}`);
        if (winStreak > 0) {
            await uploadScore(); // 0승이 아닐 때만 등록
        }
        winStreak = 0;
        scoreDisplay.textContent = winStreak;
    }
}

// 점수 등록 함수
async function uploadScore() {
    const username = document.getElementById('display-username').textContent;
    
    // 💡 연월일 시분초 문자열 만들기 (예: 2026-05-18 10:52:15)
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    try {
        const { error } = await _supabase
            .from('rankings')
            .insert([{ 
                username: username, 
                score: winStreak,
                created_at: formattedDate // 💡 테이블의 created_at 칸에 이 주소를 강제로 넣습니다.
            }]);

        if (error) throw error;
        console.log("점수 등록 완료!");
        await fetchGlobalRankings(); // 등록 후 랭킹 즉시 갱신
    } catch (err) {
        console.error("등록 실패:", err.message);
    }
}