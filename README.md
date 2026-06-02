# POGO-MOVES

고 배틀리그(GO Battle League)를 위한 포켓몬 GO 기술 데이터 시각화. 한국어 / English.

기술의 성능을 한눈에 비교합니다.

- **노말 기술 (Fast)** — DPT × EPT 산점도 + 가치 등고선(`DPT·EPT^1.5`)
- **스페셜 기술 (Charged)** — PvP는 Energy × DPE(`DPE/Energy = 1/35`), PvE는 DPS × DPE(`DPS·DPE`) 산점도
- **타입 상성표** — 18×18 공격/방어 상성 매트릭스

## 기술 스택

- [Astro](https://astro.build) (정적 생성, islands 아키텍처)
- 인터랙티브 차트는 [Preact](https://preactjs.com) island 하나 (전송 JS ≈ 13KB gzip)
- 순수 CSS (프레임워크 없음)

## 개발

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 정적 빌드 -> dist/
npm run preview    # 빌드 결과 미리보기
npm run check      # 타입 체크 (astro check)
npm run check-data # 데이터 무결성 검사
```

## 구조

```
src/
  data/
    moves.json        # 기술 데이터 (원시 스탯만 — 파생값은 계산)
    i18n/{ko,en}.json # UI 문자열 + 타입명 (단일 출처)
    pokemon.json      # 포켓몬 목록 (현재 미사용 — 향후 기술↔포켓몬 기능용 보존)
  lib/
    formulas.ts          # 원시 스탯 -> dpt/ept/dpe/dps 파생
    typeEffectiveness.ts # canonical 상성 관계 -> 18×18 매트릭스
    chartConfig.ts       # 차트 축/등고선 정의
    moves.ts, i18n.ts, types.ts
  components/
    MoveExplorer.tsx  # 필터 + 토글 + SVG 산점도 (Preact island)
    TypeChart.astro   # 상성표 (서버 렌더, JS 0)
    Nav.astro
  layouts/Base.astro
  pages/[lang]/       # /ko, /en · index(=charged), fast, type
scripts/check-data.mjs            # 데이터 무결성 검사 (CI)
scripts/build-data.mjs            # 시즌 데이터 파이프라인 (GAME_MASTER → moves.json)
scripts/build-pokemon-images.mjs # 포켓몬 스프라이트 정리 (향후 기능용 유틸)
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
```

- 스탯(power·energy·turn·duration·damageWindow·buffs)을 GAME_MASTER에서 재생성
- `name`(한국어)·`nameEn`·로스터는 기존 `moves.json`에서 보존
- 변경된 스탯 / 소스에 새로 생긴 무브 / 매핑 안 된 무브를 리포트

한계:

- 소스에 한국어 이름이 없어 **신규 무브는 자동 추가하지 않고 리포트만** 합니다(수동 추가 + 번역).
- 자기와 상대를 **동시에** 버프하는 무브(예: `obstruct`)는 단일 타깃 스키마로 표현할 수 없어 리포트로 표시 → 수동 확인.
- `--source <path>`로 다운로드 없이 로컬 GAME_MASTER 파일을 쓸 수 있습니다.

## 포켓몬 스프라이트 (향후 기능용)

`public/images/pokemon`의 스프라이트와 `src/data/pokemon.json`은 현재 화면엔 쓰이지
않지만, 향후 "기술 ↔ 포켓몬" 기능을 위해 보존합니다. 스프라이트는 PokeMiners의
[pogo_assets](https://github.com/PokeMiners/pogo_assets)에서 복사·리네임합니다
(로컬 클론 필요, CI 비포함).

```bash
npm run build-images -- <pogo_assets의 Addressable Assets 폴더 경로>
```

- `pm{dex}.icon.png` → `{dex}.png`, 폼은 `{dex}_{form}.png`
- mega·연도 이벤트 코스튬 suffix는 제외, 폼 보유 dex만 폼 스프라이트 생성
