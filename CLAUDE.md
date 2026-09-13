# AI몬스터 작업 안내 (Claude Code용)

초등 5~6학년 AI 윤리 교육 게임. 바닐라 JS + Canvas, 빌드 없음, `index.html` 더블클릭으로도 돈다.
학생용 주소는 https://legoschool.github.io/aimon/ 이고 `main` 브랜치에 올리면 1~2분 뒤 바뀐다.

## 어디에 무엇이 있나

- `data/stageN/` 스테이지 하나 = 폴더 하나
  - `stage.js` 지도, 박사님 도착 안내, 퀘스트 완료 문구, 엔딩 자막과 마지막 말, 의뢰(`MISSIONS.push`), 증표(`BADGES.push`)
  - `monsters.js` 그림자몬과 마지막 보스 (`MONSTERS.push`)
  - `questions.js` 상황 문제 (`QUESTIONS.push`)
  - `data/stage3/finale.js` 마지막 보스 어차피몬 싸움의 말과 짝 가치몬 (`FINALE`)
- `data/tools.js` 주제(TYPES), 판단 질문(TOOLS), 상성표, 가치몬 강화 규칙
- `data/map.js` `addStage` 와 지도 도우미, `data/monsters.js` `data/questions.js` `data/missions.js` `data/badges.js` 는 목록의 틀과 도우미
- `src/` 엔진. `battle.js` 보통 전투, `finale.js` 가치몬과 함께 싸우는 마지막 싸움, `title.js` 대문, `ending.js` 엔딩과 여정 증서, `dex.js` 저장
- `index.html` 의 `<script>` 순서가 곧 불러오는 순서다. 파일을 더하면 여기에도 더한다 (`tools/load.js` 도 이 목록을 읽는다)

## 고친 뒤에 반드시

```bash
node tools/check.js                 # 문항·몬스터·지도·마지막 싸움 점검. "문제 없음"이 나와야 한다
node tools/make-question-table.js   # 문항을 고쳤으면 문항표.md 다시 만들기
node tools/simulate.js 200          # 난이도 숫자를 바꿨으면 완주율 확인
```

브라우저 점검은 `.claude/launch.json` 의 `aimon`(node serve.js, 5178 포트)으로 연다.
serve.js 는 시트 연동을 끈 채로 내보낸다. 배포본(github.io)에서 점검할 때는 몬스터를 잡기 전에
페이지에서 `window.sendRecord = () => false` 를 먼저 실행한다. 그러지 않으면 선생님 시트에 가짜 줄이 쌓인다.

## 지킬 것

- 문항 원칙은 `data/questions.js` 머리말에 있다. 정답 보기가 가장 긴 보기가 되지 않게, 보너스 정답 번호도 흩는다.
- 문항·몬스터·의뢰·증표의 `id` 는 학생 저장본에 남는다. 바꾸면 이미 한 학생의 기록이 사라진다.
- 저장본에 새 칸을 더할 때는 `src/dex.js` 의 `blankSave` 에 기본값을 넣는다. `applySave` 가 예전 저장본에 새 칸을 채운다.
- 한국어 문서는 사용자 전역 지침(AI 슬롭 제거)을 따른다. 문서를 고치면 README · 수업활용안내 · DESIGN · 문항표를 함께 맞춘다.
- 문항을 고치면 함정 설명도 맞춘다. 3스테이지는 `data/stage3/questions.js` 의 문항 위 `// 함정:` 주석, 2·3스테이지는 `스테이지2_문항설계.md` · `스테이지3_문항설계.md` 의 함정 표.
- 저장본 칸을 새로 쓰면 `blankSave` 에 없는지 확인한다. 없으면 다시 불러올 때 사라진다 (partyBest 가 그랬다).
- 시트 창구 코드는 `구글시트연동.md` 한 곳에만 있다. 창구 칸을 바꾸면 `src/sheet.js`, `src/admin.js` 와 함께 고치고 버전(VERSION)을 올린다.
