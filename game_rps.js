let rpsStreak = 0; 

async function playGame(userChoice) {
    if (!currentUsername) {
        alert("시작하기 버튼을 먼저 눌러주세요!");
        return;
    }
    if (typeof canSubmitRpsScore === 'function' && !canSubmitRpsScore()) return;

    const choices = ['rock', 'paper', 'scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    const koreanChoices = { rock: '👊 주먹', paper: '🖐️ 보', scissors: '✌️ 가위' };
    let result = '';

    if (userChoice === computerChoice) {
        result = `무승부입니다! 🤝\n현재 ${rpsStreak}연승 유지 중!`;

    } else if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        rpsStreak++;
        result = `이겼습니다! 🎉\n현재 ${rpsStreak}연승 중!`;
        document.getElementById('user-score').innerText = rpsStreak;
        
    } else {
        if (rpsStreak > 0) {
            await uploadRpsScore(rpsStreak);
        }
        result = `졌습니다... 😭\n최종 기록: ${rpsStreak}연승\n\n다시 도전해 보세요!`;
        rpsStreak = 0; 
        document.getElementById('user-score').innerText = rpsStreak;
    }

    document.getElementById('result-text').innerText = 
        `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
}

async function uploadRpsScore(score) {
    if (!initSupabase() || score < 0 || score > 100) return;
    try {
        // 🔒 Token이든 Hash든 호환성 유연 자동 추적 매핑
        let verificationHash = "";
        if (typeof generateVerificationToken === 'function') {
            verificationHash = generateVerificationToken(currentUsername, score);
        } else if (typeof generateVerificationHash === 'function') {
            verificationHash = generateVerificationHash(currentUsername, score);
        }
        
        const { error } = await window._supabase.from('rankings').insert([{ 
            username: currentUsername, 
            score: score, 
            verification_token: verificationHash 
        }]);
        
        if (error) throw error;
        if (typeof lockRpsSubmitTime === 'function') lockRpsSubmitTime();
        fetchGlobalRankings();
    } catch (err) { 
        console.error("가위바위보 업로드 실패:", err); 
    }
}

async function fetchGlobalRankings() {
    if (!initSupabase()) return;
    try {
        const { data, error } = await window._supabase.from('rankings').select('*').order('score', { ascending: false }).limit(10);
        if (error) throw error;
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = data.length === 0 ? '<li>랭킹이 없습니다.</li>' : '';
        data.forEach((player, index) => {
            const dateString = new Date(player.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
            const li = document.createElement('li');
            li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            rankingList.appendChild(li);
        });
    } catch (err) { 
        console.error("가위바위보 랭킹 로드 실패:", err); 
    }
}