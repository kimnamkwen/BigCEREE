# 보건의료 빅데이터 및 비교효과연구 경제성평가 센터

이 프로젝트는 센터 및 연구실 소개, 임상연구, 빅데이터 분석, 경제성 평가, 프로젝트, 강의 정보 제공을 위한 웹 포털입니다.

## 주요 화면 기능

-   센터 및 연구진 소개
-   임상연구·빅데이터 분석·경제성평가 기본 이론 안내
-   진행중/완료 프로젝트 및 강의 일정 안내
-   논문, 보고서, 템플릿 등 다운로드 연동

## 연구 사례 및 발표논문

-   **임상 연구** 하위의 세 연구 유형은 `research.js`에 정의되어 있습니다. 메뉴를 옮길 때 `index.html`에서 `economicResearchSections`를 원하는 메뉴에 배치하면 기존 연구 링크를 계속 사용할 수 있습니다.
-   **센터 소개 → 발표논문**에서는 `publications-data.js` 목록에서 2010년 이후(2010년 포함)에 발행된 논문을 제목·저자·학술지와 발행연도로 검색할 수 있습니다. 목록을 확인할 때는 [부산대 연구실적](https://scholar2.pusan.ac.kr/resources?f%5Bscholar%5D=01a19069-b4f5-7458-878c-da00023bec69&sort=year)과 KCI·PubMed의 개별 논문 정보를 대조합니다.
-   확인한 논문의 제목, 저자, 학술지, 연도와 DOI·PMID·KCI 상세 링크·공식 URL 중 하나를 `publications-data.js`에 추가합니다. 사례 설명과 연결 논문은 `research.js`에서 수정합니다.

### 발표논문 후보 수집

Node.js 24 환경에서 아래 명령을 실행할 수 있습니다. GitHub에서는 기본 브랜치에 워크플로가 반영된 뒤 **Actions → Publication catalog → Run workflow**로 후보 수집을 실행합니다. 워크플로가 만든 `publication-candidates.json`은 실행 결과의 Artifacts에서 받을 수 있습니다.

```sh
node scripts/publications.mjs check
node scripts/publications.mjs collect > publication-candidates.json
```

후보 보고서에는 Europe PMC의 PubMed 레코드와 Crossref에서 확인한 신규 논문, 서지 변경, 추가 검토가 필요한 항목이 들어갑니다. DOI·PMID·KCI ID가 일치하는 레코드를 대조하고, 식별자가 충돌하거나 제목만 일치하는 경우는 검토 대상으로 표시합니다. 출처별 조회 실패도 보고서에 남깁니다. 게시할 내용은 검토 후 `publications-data.js`에 반영하고 PR로 제출합니다.

## 링크 및 참고

-   **교수 상세 프로필:**\
    [<https://drkim.pusan.ac.kr/drkim/index.do>]

    -   메뉴에서 "교수소개" 클릭 시, 화면에 "교수 상세 프로필" 을 확인할 수 있습니다.

-   **의한협진모니터링센터:**\
    [<https://www.mcmc.re.kr/>]

-   **GitHub:**\
    [<https://github.com/kimnamkwen/BigCEREE>]
