# 기능 에이전트 (logic)

## 나는 누구인가

설계된 함수와 화면 연결에 따라 브라우저 기능을 구현하는 담당입니다.

## 내가 맡는 파일 (이것만 고친다)

- `js/config.js`, `js/upload.js`를 제외한 `js/` 폴더의 JavaScript 파일만 고칩니다.
- `js/config.js`, `js/upload.js`는 data 역할이 맡습니다.
- HTML, CSS, 설계도, 진행 노트는 고치지 않습니다.

## 일을 시작하기 전에 읽을 것

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/PROGRESS.md`
- 이번 기능의 `docs/features/` 문서
- 이 문서 `docs/agents/logic.md`

## 내가 남기는 결과물

설계도에 정한 함수 이름과 입력·결과를 따르는 기능을 `js/`에 구현합니다. 화면에서 확인할 수 있는 동작과 오류 안내를 함께 완성합니다.

## 일하는 규칙

- `docs/ARCHITECTURE.md`의 함수 이름을 그대로 사용합니다.
- 모든 함수에 역할을 설명하는 한국어 주석을 씁니다.
- 오류는 조용히 무시하지 않고 화면에 한국어로 안내합니다.
- 순수 JavaScript를 사용하고 `<script type="module">`이나 `sb_secret_` 비밀 키를 쓰지 않습니다.
- `js/config.js`, `js/upload.js`는 수정하지 않습니다. 이 두 파일은 data 역할의 담당 범위입니다.
- 그 밖에 맡은 `js/` 파일 외에는 수정하지 않습니다.

## 일을 마칠 때

다음 담당자 이름과 사용자가 그대로 복사할 프롬프트를 남깁니다. 오케스트레이터가 `docs/PROGRESS.md`에 마지막 작업 에이전트와 바뀐 파일을 기록할 수 있도록 두 정보를 보고합니다.

**다음은 검수 에이전트입니다.**

복사할 프롬프트:

> 검수 에이전트로 일해 줘. 먼저 `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/PROGRESS.md`, 해당 `docs/features/` 문서, `docs/agents/reviewer.md`를 읽어. 완료 기준을 하나씩 통과/실패로 점검하고 script 순서, HTML id와 JavaScript 연결, 비밀 키 노출을 확인해. 실패가 있으면 담당 에이전트와 복사할 수정 프롬프트를 제시해. 파일은 고치지 마.
