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
            .from('ranking')
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

        data.forEach((player, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}위: ${player.username} - ${player.score}연승`;
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

    if (userChoice === computerChoice) {
        resultText.textContent = `비겼습니다! (컴퓨터: ${choiceNames[computerChoice]})`;
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
        alert(`게임 종료! 최종 연승: ${winStreak}`);
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
    
    try {
        const { error } = await _supabase
            .from('ranking')
            .insert([{ username: username, score: winStreak }]);

        if (error) throw error;
        console.log("점수 등록 완료!");
        await fetchGlobalRankings(); // 등록 후 랭킹 즉시 갱신
    } catch (err) {
        console.error("등록 실패:", err.message);
    }
}
