# POGO-MOVES

고 배틀리그(GO Battle League)를 위한 포켓몬 GO 도구 모음. 한국어 / English.

배틀 시뮬레이터가 아니라, **공개 공식으로 직접 계산**하는 가벼운(전송 JS 페이지당 ~15–18KB gzip)
한국어 친화 도구입니다 — 기술 데이터 시각화에 더해 IV 랭크·데미지·브레이크포인트·팀 약점까지.

## 기능

- **노말 기술 (Fast)** — DPT × EPT 산점도 + 가치 등고선(`DPT·EPT^1.5`). 겹치는 점은 타입색
  클러스터 글리프로 묶고, 호버/탭하면 스킬 스펙이 펼쳐집니다.
- **스페셜 기술 (Charged)** — PvP는 Energy × DPE(`DPE/Energy = 1/35`), PvE는 DPS × DPE 산점도
- **타입 상성표** — 18×18 공격/방어 상성 매트릭스 (서버 렌더 + 키보드 탐색)
- **포켓몬 페이지** (`/[lang]/pokemon`) — 검색 → 스프라이트·타입·종족값, 리그(GL/UL/ML) 점수·
  추천 기술(★)·매치업(유리/불리)·진화·방어 상성. 그리고:
  - **2종 비교** — 종족값(미러 바)·타입·리그 점수·기술셋 나란히 (`?c=`로 공유)
  - **IV 랭크 체커** — CP캡 내 4096조합을 벌크(스탯프로덕트)로 정렬, 내 IV 순위·CMP·인게임 검색 문자열
  - **무브 카운트** — 평타 → 차지 발동 타수 매트릭스
  - **브레이크포인트** — 비교 뷰에서 평타 매치업 데미지 + 다음 BP (정확한 PvP 데미지 공식)
  - **그림자 보정** — 적격 포켓몬 ×1.2 공격 / ×0.833 방어를 브레이크포인트에 반영
- **기술 도감** (`/[lang]/move`) — 기술 상세 스펙 + 그 기술을 쓰는 포켓몬 + 리그별 추천 채택
- **팀 커버리지** (`/[lang]/team`) — 2~6마리의 **공통 약점 그리드** + 자속 공격 커버리지 (`?t=`로 공유)

## 자체 계산 (시뮬레이션 아님)

pvpoke 같은 배틀 엔진을 흉내내지 않고, 표준 공개 공식으로 **우리가 직접** 계산합니다 — 외부
의존·라이선스 없이, 한국어 UX와 시각화에 집중:

| 영역 | 소스 |
| --- | --- |
| IV 랭킹 · 스탯프로덕트 · CMP | `lib/ivRank.ts` + `lib/cpm.ts` (CPM·CP 공식) |
| 데미지 · 브레이크포인트 | `lib/damage.ts` (pvpoke `DamageCalculator`의 정확한 상수) |
| 타입 커버리지 · 약점 | `lib/teamCoverage.ts` (상성 매트릭스) |
| 파생 무브 스탯(dpt/ept/dpe/dps) | `lib/formulas.ts` |

리그 랭킹·추천 무브셋·매치업(유리/불리)은 pvpoke가 공개한 데이터를 가공해 **표시**합니다
(`lib/rankings.ts`, `scripts/build-rankings.mjs`). 즉 랭킹 데이터는 pvpoke 산출물, 계산 도구는 자체 구현입니다.

## 기술 스택

- [Astro](https://astro.build) (정적 생성, islands 아키텍처)
- 인터랙티브 뷰는 [Preact](https://preactjs.com) islands · 순수 CSS (프레임워크 없음)
- 전송 JS ≈ 페이지당 15–18KB gzip(preact 런타임 포함), 가장 큰 island(포켓몬) ~6.3KB gz
- PWA(오프라인 service worker) · 한국어/English · `vitest` 단위 테스트

## 개발

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 인덱스 생성 + 정적 빌드 -> dist/
npm run preview    # 빌드 결과 미리보기
npm run check      # 타입 체크 (astro check)
npm test           # 단위 테스트 (vitest)
npm run check-data # 데이터 무결성 검사
```

## 구조

```
src/
  data/
    moves.json        # 기술 데이터 (원시 스탯만 — 파생값은 계산)
    pokemon.json      # 포켓몬 로스터·스탯·기술셋·그림자 적격 (pvpoke)
    i18n/{ko,en}.json # UI 문자열 + 타입명 (단일 출처)
  lib/
    formulas.ts          # 원시 스탯 -> dpt/ept/dpe/dps + 무브 카운트
    damage.ts            # 정확한 PvP 데미지·브레이크포인트 공식
    ivRank.ts, cpm.ts    # IV 랭킹·CMP·검색 문자열 / CP Multiplier 표
    teamCoverage.ts      # 팀 약점·공격 커버리지 (상성 기반)
    typeEffectiveness.ts # canonical 상성 관계 -> 18×18 매트릭스
    chartConfig.ts, moveChart.ts  # 차트 축/등고선 / 무브→점 매핑
    rankings.ts          # pvpoke 리그 랭킹 lazy 로더
    pokemonIndex.ts      # 슬림 포켓몬 인덱스/역인덱스 lazy 로더 (public/data)
    urlState.ts, moves.ts, i18n.ts, types.ts
  components/
    MoveExplorer.tsx     # 필터 + SVG 산점도 + 클러스터 글리프 + 무브↔포켓몬 (island)
    PokemonExplorer.tsx  # 포켓몬 페이지 (island) — 비교·IV·무브카운트·그림자 통합
    PokemonCompare.tsx   # 2종 비교 + 브레이크포인트
    IvChecker.tsx, TeamCoverage.tsx, MovePage.tsx
    MoveList.tsx, MovePanel.tsx, PokemonSearch.tsx, PokeSprite.tsx
    TypeChart.astro      # 상성표 (서버 렌더, JS 0)
    Nav.astro
  layouts/Base.astro     # 메타/OG · PWA · service worker 등록
  pages/[lang]/          # /ko, /en · index(=charged), fast, move, pokemon, team, type
  pages/sitemap.xml.ts
scripts/
  check-data.mjs / build-data.mjs        # 무브 데이터 무결성 / 시즌 파이프라인
  build-pokemon-data.mjs                 # pvpoke 로스터 갱신 (drift 리포트)
  build-pokemon-index.mjs                # 슬림 인덱스/역인덱스 (build에 포함)
  build-rankings.mjs                     # pvpoke 리그 랭킹 슬림화 (-> public/data)
  build-cpm.mjs                          # PokeMiners 게임마스터 -> CPM 표 (lib/cpm.ts)
  fetch-pokemon-images.mjs / build-pokemon-images.mjs  # 스프라이트
```

## 데이터 모델

기술 한 건은 **원시 스탯만** 저장하고, `dpt`·`ept`·`dpe`·`dps` 같은 파생값은
`src/lib/formulas.ts`에서 계산합니다(저장하지 않음 → 단일 출처).

```json
{
  "id": "acid_spray",
  "name": "애시드봄",
  "nameEn": "Acid Spray",
  "type": "poison",
  "pvp": { "power": 20, "energy": 45, "buffs": [0, -2], "buffTarget": "opponent", "buffApplyChance": 1 },
  "pve": { "power": 20, "energy": 50, "duration": 3, "damageWindowStart": 2.1, "damageWindowEnd": 2.8 }
}
```

타입 상성표도 손으로 적은 매트릭스가 아니라, `typeEffectiveness.ts`의
공격 관계 정의(약점/저항/무효)에서 계산됩니다. 포켓몬 GO에는 무효가 없어
본가의 ×0이 2중 저항(×0.39)이 됩니다.

## 데이터 파이프라인 (시즌 업데이트)

기술 스탯은 손으로 고치지 않고 원천 GAME_MASTER(PokeMiners)에서 갱신합니다.
한국어 이름과 로스터는 보존되고, 스탯만 새로고침됩니다.

```bash
npm run build-data             # 비교만 — 변경/신규/미매핑 리포트 출력
npm run build-data -- --write  # moves.json 갱신
npm run check-data             # 스키마 검증
npm run build-rankings         # pvpoke 리그 랭킹(GL/UL/ML) -> public/data/rankings-*.json
npm run build-cpm              # PokeMiners 게임마스터 CPM 표 -> src/lib/cpm.ts
```

- 스탯(power·energy·turn·duration·damageWindow·buffs)을 GAME_MASTER에서 재생성
- `name`(한국어)·`nameEn`·로스터는 기존 `moves.json`에서 보존
- 변경된 스탯 / 소스에 새로 생긴 무브 / 매핑 안 된 무브를 리포트
- 신규 무브는 `scripts/data/move-names-ko.csv`([veekun](https://github.com/veekun/pokedex))에서 한글명을 찾으면 **자동 추가**, 못 찾으면(GO 전용 코스메틱 변형 등) 스킵·리포트. 참조 데이터는 `scripts/data/README.md`.

한계:

- 자기·상대를 **동시에** 버프하는 무브(예: `obstruct`)는 단일 타깃 스키마로 표현 불가 → 파이프라인이 기존 버프 값을 **보존**(덮어쓰지 않음). 표시는 한쪽만(현재 상대 방어 −1).
- `--source <path>`로 다운로드 없이 로컬 GAME_MASTER 파일을 쓸 수 있습니다.

### 자동화

`.github/workflows/update-data.yml`이 매주(및 수동 실행 시) `build-data`(무브 스탯)와
`build-pokemon-data`(pvpoke 로스터)를 돌리고 인덱스를 재생성해, `moves.json`·`pokemon.json`·
`public/data`가 바뀌면 `data/auto-refresh` 브랜치로 **PR을 엽니다**. 그 PR을 머지하면
기존 Vercel 연동이 **프로덕션 배포를 자동 트리거**합니다.

> 저장소 Settings → Actions → General → Workflow permissions에서 **"Read and write
> permissions"** 와 **"Allow GitHub Actions to create and approve pull requests"** 를
> 켜야 PR 생성이 됩니다.

## 기술 ↔ 포켓몬

`src/data/pokemon.json`(pvpoke)을 슬림 인덱스로 가공합니다
(`npm run build-pokemon-index` → `public/data/pokemon-index.json` + 역인덱스
`move-pokemon.json`, lazy-fetch · `npm run build`에 포함). 이를 통해:

- **무브 → 포켓몬**: 차트의 기술 칩/클러스터 → 그 기술을 쓰는 포켓몬 그리드(+ 기술 도감)
- **포켓몬 → 기술**: 포켓몬 검색·선택 → 그 포켓몬의 기술 칩을 차트에서 하이라이트(페이지 간 유지)
- **포켓몬 페이지·비교·팀 커버리지**: 종족값·타입·기술셋·그림자 적격을 소스로

한글명은 `scripts/data/species-i18n.csv`(veekun) + `species-ko-extra.json`(override)에서 옵니다.
로스터(`pokemon.json`)는 `npm run build-pokemon-data`로 pvpoke에서 갱신합니다(주간 자동화 포함).

### 스프라이트 갱신

스프라이트는 PokeMiners [pogo_assets](https://github.com/PokeMiners/pogo_assets)에서 받습니다.
누락분(주로 신규 세대)은 아래로 보강하며, **로컬에서 실행**하세요(클라우드 세션에선
PokeMiners API/CDN이 막혀 있습니다):

```bash
npm run fetch-images           # 폴더 자동 탐색 → raw에서 누락분만 다운로드 (클론 불필요)
npm run fetch-images -- --dry  # 다운로드 없이 탐색/대상 미리보기
GH_TOKEN=<token> npm run fetch-images   # rate limit 시 (60 → 5000/hr)
npm run build-pokemon-index    # 받은 뒤 인덱스 재생성 (보유/누락 수 리포트)
```

오프라인(클론 보유 시): `npm run build-images -- <pogo_assets 스프라이트 폴더>`.
규칙: `pm{dex}.icon.png` → `{dex}.png`, 폼은 `{dex}_{form}.png`, mega·연도 코스튬 제외
(공유 로직 `scripts/lib/pokeminers-sprites.mjs`). 없는 스프라이트는 UI에서 타입색+도감번호 폴백.
