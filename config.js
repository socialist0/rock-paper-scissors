// 1. 내 프로젝트의 진짜 주소와 API 키
const supabaseUrl = 'https://zqocsmfeigllzqladkqj.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxb2NzbWZlaWdsbHpxbGFka3FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODcxNzYsImV4cCI6MjA5NDI2MzE3Nn0.RC6XmK9zSaX5BnXYz_-rUFu2YMOq4_pOw7qDPELdnIk'; 

// 2. 전역 변수로 _supabase 객체를 생성합니다 (가장 안전한 선언 방식)
window._supabase = supabase.createClient(supabaseUrl, supabaseKey);