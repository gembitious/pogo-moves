# 참조 데이터

파이프라인(`scripts/build-data.mjs`)과 향후 기능이 쓰는 외부 출처 데이터입니다.

## veekun/pokedex

[veekun/pokedex](https://github.com/veekun/pokedex) `pokedex/data/csv/` (PokéAPI도 동일 데이터 사용).

| 파일 | 원본 | 형식 / 용도 |
| --- | --- | --- |
| `move-names-ko.csv` | `move_names`(영/한 추출, 가공본) | `영문명,한글명` — 파이프라인이 신규 무브 한글명에 사용 |
| `moves-i18n.csv` | `move_names.csv` | `move_id, local_language_id, name` (다국어 무브명) — 향후 UI 다국어용 |
| `species-i18n.csv` | `pokemon_species_names.csv` | `species_id, local_language_id, name, genus` (다국어 포켓몬명·분류) — 향후 포켓몬 기능용 |

`local_language_id`: **3=한국어, 9=영어**, 1=일(가나)·4=중(번체)·5=프·6=독·7=스·8=이·11=일(한자)·12=중(간체).

## pvpoke

[pvpoke](https://github.com/pvpoke/pvpoke) gamemaster.

| 파일 | 형식 / 용도 |
| --- | --- |
| `pvpoke-moves.json` | PvP 무브 + **`archetype`**(역할 분류). 파이프라인이 `archetype`를 `moves.json`에 부여 → 앱의 역할 필터/툴팁 |

> `../src/data/pokemon.json`도 pvpoke gamemaster(로스터·스탯·기술·진화·그림자)이며, 보존된 스프라이트 + `species-i18n.csv`(한글명)와 함께 향후 "기술↔포켓몬" 기능의 토대입니다. (무브 id가 대문자라 연동 시 소문자화 필요.)

## 주의

veekun·pvpoke는 메인시리즈/PvP 기준이라 GO 전용 변형(타입별 Hidden Power, 드라이브별 Techno Blast, `_plus`/`_blastoise` 코스메틱, Max 무브)은 빠질 수 있습니다 — 파이프라인이 스킵·리포트합니다.
