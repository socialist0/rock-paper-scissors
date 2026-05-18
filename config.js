// 1. Supabase 접속 정보 설정 (본인의 실제 프로젝트 ID 주소와 키)
const supabaseUrl = 'https://zqocsmfeigllyzqladkqj.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk'; 

// 2. 외부 라이브러리(CDN) 객체를 명시하여 안전하게 클라이언트 생성
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);