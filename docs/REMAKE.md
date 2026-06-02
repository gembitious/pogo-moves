# 리메이크 기록 (Next.js → Astro)

GO 배틀리그용 포켓몬 GO 기술 데이터 사이트를, **제공하던 정보는 그대로 보존**하고
구현/구조만 전면 교체한 리메이크 기록입니다. (PR #1, `main`에 머지)

## 원칙

> 이 사이트가 보여주던 것 — 기술 산점도+가치 등고선, 18×18 타입 상성표, 타입 필터,
> PvP/PvE 토글, 툴팁, 겹친 칩 펼침, 한·영 — 은 그대로. 그 외 구현은 가장 가볍게 다시.

## 스택 결정

정적 데이터 · SSG · 작은 인터랙션 섬 · i18n · SEO 성격에 맞춰 Astro vs Next vs
Vite+React vs SvelteKit을 비교 → **Astro** 채택. Tailwind 회피 → 순수 CSS,
React 무거움 회피 → **Preact island**, 차트도 라이브러리 없이 **직접 SVG**.

## Before → After

| 항목 | Before | After |
| --- | --- | --- |
| 프레임워크 | Next.js 14 | Astro 6 (SSG/islands) |
| UI/스타일 | MUI + Emotion + Tailwind | Preact island + 순수 CSS |
| 차트 | 290줄 캔버스 엔진 + 절대좌표 칩 | 선언적 SVG 산점도 |
| 상성표 | 419줄 수기 18×18 | canonical 관계 ~18줄 → 계산 |
| 파생값 | JSON에 박제 | 원시 스탯에서 계산 (단일 출처) |
| 무브 데이터 | 4개 파일 분리 | `moves.json` 단일 통합 |
| 전송 JS | 수백 KB (React+MUI) | ≈13KB gzip |
| 상성표 페이지 JS | client 렌더 | 0 바이트 (서버 렌더) |
| CI/문서 | 없음 / 보일러플레이트 | CI + 실제 README |

## "정보의 결" 보존 — 검증으로 증명

- **무브 데이터 무손실**: 원시 스탯에서 재계산한 파생값을 기존 저장값과 대조 →
  321개 무브 전부 **0건 불일치**. 무브 수 보존(fast 97, charged 224).
- **상성표 동치**: canonical 관계에서 계산한 18×18을 기존 매트릭스와 대조 →
  **324셀 0 diff**(GO 규칙 "본가 무효 → 2중 저항"까지 일치).
- **차트 의미 보존**: 축 도메인·등고선 함수·라벨을 원본 그대로 이식.

## 구조

```
src/
  data/moves.json          # 원시 스탯만 (파생값은 계산)
  data/i18n/{ko,en}.json   # UI 문자열 + 타입명 (단일 출처)
  data/pokemon.json        # 미사용, 향후 기능용 보존
  lib/formulas.ts          # dpt/ept/dpe/dps 파생
  lib/typeEffectiveness.ts # 공격 관계 → 18×18 계산
  lib/chartConfig.ts       # 축/등고선 정의 (원본 보존)
  components/MoveExplorer.tsx  # 필터+토글+SVG 산점도+툴팁 (Preact island)
  components/TypeChart.astro   # 상성표 (서버 렌더, JS 0)
  layouts/Base.astro
  pages/[lang]/            # /ko·/en — index(=charged), fast, type
scripts/                   # check-data, build-data (데이터 파이프라인)
```

## 데이터 모델

무브 1건은 **원시 스탯만** 저장하고 `dpt/ept/dpe/dps`는 `lib/formulas.ts`에서 계산합니다.

```json
{
  "id": "acid_spray", "name": "애시드봄", "nameEn": "Acid Spray", "type": "poison",
  "pvp": { "power": 20, "energy": 45, "buffs": [0, -2], "buffTarget": "opponent", "buffApplyChance": 1 },
  "pve": { "power": 20, "energy": 50, "duration": 3, "damageWindowStart": 2.1, "damageWindowEnd": 2.8 }
}
```

타입 상성표도 손으로 적은 매트릭스가 아니라 `lib/typeEffectiveness.ts`의 공격 관계
(약점/저항/무효)에서 계산합니다.

## 검증

- **브라우저(Playwright)**: 산점도·필터(222→20)·PvP/PvE 토글(222↔219)·툴팁·
  fast(97, DPT·EPT)·상성표(324셀)·영어 전환 전부 PASS.
- **3각도 셀프 리뷰**: 정확성·라우팅 버그 0. 회귀 1건(겹친 칩 spread-on-hover 유실)
  발견 → 고정 점 마커 + 클러스터 hover 펼침으로 복원, 브라우저 재검증.
  개선 2건(구 URL 308 리다이렉트, hreflang/canonical).

## 운영

- CI: `npm ci → check-data → astro check → astro build`.
- Vercel: `vercel.json`(정적 프리셋 + 루트/구경로 리다이렉트), main 머지 시 자동 배포.

## 시즌 데이터 업데이트

`scripts/build-data.mjs`로 원천 GameMaster에서 `moves.json`을 갱신할 수 있습니다
(한국어 이름은 보존). 자세한 사용법은 README의 "데이터 파이프라인" 참고.
