# 1. 공식 Node.js 이미지 기반, 버전 고정
FROM node:20.10.0-alpine

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 종속성 관련 파일 복사 및 설치
COPY package.json package-lock.json* ./
RUN npm install

# 4. 전체 프로젝트 복사
COPY . .

# 5. Next.js 빌드
RUN npm run build

# 6. 포트 설정 (Next.js 기본 포트)
EXPOSE 3000

# 7. 프로덕션 서버 실행
CMD ["npm", "start"]
