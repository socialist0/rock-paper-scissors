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

        const rankingList = document.getElementById('rankingList');
        if (!rankingList) return;

        rankingList.innerHTML = ''; 

        if (!data || data.length === 0) {
            rankingList.innerHTML = '<li>아직 등록된 기록이 없습니다.</li>';
            return;
        }

        data.forEach((player, index) => {
            const li = document.createElement('li');
            
            // Supabase에서 가져온 날짜/시간 정보를 한국 시간 형식으로 예쁘게 변환
            const date = new Date(player.created_at);
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

            li.textContent = `${index + 1}위: ${player.username} - ${player.score}연승 (${dateString})`;
            rankingList.appendChild(li);
        });
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

    // 1. 비겼을 때 조건 시작
    if (userChoice === computerChoice) {
        resultText.innerHTML = `비겼습니다! 🤝<br>연승이 유지됩니다. (컴퓨터: ${choiceNames[computerChoice]})`;
        scoreDisplay.textContent = winStreak; 
        
    } else if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        winStreak++;
        resultText.textContent = `이겼습니다! 🎉 (컴퓨터: ${choiceNames[computerChoice]})`;
        scoreDisplay.textContent = winStreak;
        
    } else {
        resultText.textContent = `졌습니다... 💀 (컴퓨터: ${choiceNames[computerChoice]})`;
        if (winStreak > 0) {
            await uploadScore(); 
        }
        winStreak = 0;
        scoreDisplay.textContent = winStreak;
    } 
} 

// 점수 등록 함수
async function uploadScore() {
    const username = document.getElementById('display-username').textContent;
    
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    try {
        const { error } = await _supabase
            .from('rankings')
            .insert([{ 
                username: username, 
                score: winStreak,
                created_at: formattedDate 
            }]);

        if (error) throw error;
        console.log("점수 등록 완료!");
        await fetchGlobalRankings(); 
    } catch (err) {
        console.error("등록 실패:", err.message);
    }
}