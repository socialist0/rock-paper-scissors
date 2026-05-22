let rpsStreak = 0; 
let lastRpsUploadedId = null; // 내가 방금 등록한 순위를 기억하기 위한 변수

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
        // 비겼을 때: 문구만 출력하고 연승 유지, 서버 업로드 없이 즉시 함수 종료
        result = `무승부입니다! 🤝\n현재 ${rpsStreak}연승 유지 중!`;
        document.getElementById('result-text').innerText = 
            `나: ${koreanChoices[userChoice]} vs 컴퓨터: ${koreanChoices[computerChoice]}\n\n${result}`;
        return; 
    } 
    
    if (
        (userChoice === 'rock' && computerChoice === 'scissors') ||
        (userChoice === 'paper' && computerChoice === 'rock') ||
        (userChoice === 'scissors' && computerChoice === 'paper')
    ) {
        // 이겼을 때: 연승 카운트 증가, 화면 갱신 후 종료
        rpsStreak++;
        result = `이겼습니다! 🎉\n현재 ${rpsStreak}연승 중!`;
        document.getElementById('user-score').innerText = rpsStreak;
        
    } else {
        // 졌을 때: 오직 졌을 때만 연승 기록이 1 이상일 경우 서버에 저장 시도
        if (rpsStreak > 0) {
            await uploadRpsScore(rpsStreak);
        } else {
            lastRpsUploadedId = null; // 0연승일 때는 하이라이트 초기화
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
        let verificationHash = "";
        if (typeof generateVerificationToken === 'function') {
            verificationHash = generateVerificationToken(currentUsername, score);
        } else if (typeof generateVerificationHash === 'function') {
            verificationHash = generateVerificationHash(currentUsername, score);
        }
        
        // 저장 후 새로 생성된 행의 고유 ID(id)를 가져옵니다.
        const { data, error } = await window._supabase.from('rankings').insert([{ 
            username: currentUsername, 
            score: score, 
            verification_token: verificationHash 
        }]).select();
        
        if (error) throw error;
        
        // 방금 등록된 데이터의 고유 ID를 확실하게 문자열로 변환하여 보관 (타입 불일치 방지)
        if (data && data.length > 0) {
            lastRpsUploadedId = String(data[0].id);
        }
        
        if (typeof lockRpsSubmitTime === 'function') lockRpsSubmitTime();
        fetchGlobalRankings();
    } catch (err) { 
        console.error("가위바위보 업로드 실패:", err); 
    }
}

async function fetchGlobalRankings() {
    if (!initSupabase()) return;
    try {
        // 중복 제거 계산을 위해 전체 데이터를 최신순으로 정렬하여 넉넉히 가져옵니다.
        const { data, error } = await window._supabase
            .from('rankings')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        const rankingList = document.getElementById('rankingList');
        if (!rankingList) return;
        
        rankingList.innerHTML = '';

        if (!data || data.length === 0) {
            rankingList.innerHTML = '<li>랭킹이 없습니다.</li>';
            return;
        }

        // 동일 닉네임 + 동일 점수의 중복을 제거하고 오직 최신 것 1개만 남깁니다.
        const uniqueRankings = [];
        const seenPairs = new Set();

        for (const player of data) {
            const uniqueKey = `${player.username}_${player.score}`;
            
            if (!seenPairs.has(uniqueKey)) {
                seenPairs.add(uniqueKey);
                uniqueRankings.push(player);
            }
            
            if (uniqueRankings.length >= 10) break;
        }
        
        // 화면에 바인딩 및 하이라이트 검사
        uniqueRankings.forEach((player, index) => {
            const dateString = new Date(player.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
            const li = document.createElement('li');
            
            // 🌟 [교정] 타입 유연성을 위해 형변환 후 대조 처리 (== 사용 또는 양쪽 다 String 변환)
            const isMyNewScore = lastRpsUploadedId && (String(player.id) === lastRpsUploadedId);
            
            if (isMyNewScore) {
                li.style.backgroundColor = '#e6f4ea'; 
                li.style.color = '#137333';
                li.style.fontWeight = 'bold';
                li.style.borderRadius = '5px';
                li.style.padding = '6px 10px';
                li.style.margin = '4px 0';
                li.style.border = '1px solid #max-content'; // 테두리 살짝 추가하여 강조 효과 극대화
                li.style.transition = 'all 0.5s ease';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#137333; float:right;">(${dateString})</span>`;
            } else {
                li.style.padding = '4px 8px';
                li.innerHTML = `<strong>${index + 1}위.</strong> ${player.username} — 🏆 ${player.score}연승 <span style="font-size:0.85rem; color:#888; float:right;">(${dateString})</span>`;
            }
            rankingList.appendChild(li);
        });
    } catch (err) { 
        console.error("가위바위보 랭킹 로드 실패:", err); 
    }
}