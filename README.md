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

`Publication catalog`는 기본 브랜치에 반영된 뒤 매주 화요일 오전 10시 17분(한국 시간)에 후보를 수집합니다. 즉시 조회하려면 **Actions → Publication catalog → Run workflow**에서 `main`을 선택합니다. 결과 요약은 Actions 실행 화면에 표시되며, 상세 보고서는 **Artifacts → publication-candidates**에서 받을 수 있습니다.

```sh
npm ci --prefix scripts --ignore-scripts --no-audit --no-fund
node scripts/publications.mjs check
node scripts/publications.mjs collect > publication-candidates.json
```

후보 보고서에는 2010년부터 발행된 논문의 신규 후보, 서지 변경, 추가 검토가 필요한 항목이 들어갑니다. DOI·PMID·KCI ID가 일치하는 레코드를 대조하고, 식별자가 충돌하거나 제목만 일치하는 경우는 검토 대상으로 표시합니다. 한 출처의 조회가 실패하면 다른 출처 결과와 실패 사유를 보존합니다. 게시할 내용은 검토 후 `publications-data.js`에 반영하고 PR로 제출합니다.

#### Google Drive로 누락 논문 제출

교수님은 전용 비공개 폴더에 PDF를 올립니다. 수집 작업은 PDF 첫 페이지와 문서 메타데이터에서 DOI를 찾고 Crossref 제목과 대조합니다. 서지가 확인되면 기존 PubMed·Crossref 결과와 함께 후보로 검토할 수 있습니다. 스캔본, DOI가 없는 PDF, 25 MiB를 넘는 PDF와 서지가 불확실한 PDF는 확인이 필요한 사유를 표시합니다. 보고서에는 공개 서지정보와 파일 참조 코드가 들어갑니다. PDF와 파일명, Drive 링크는 전용 폴더에서 관리합니다.

운영 환경을 연결하려면 다음을 설정합니다.

1. 센터가 관리하는 Google Cloud 프로젝트에서 Drive API를 활성화합니다. 수집 전용 서비스 계정을 만들고 운영용 Drive 폴더에 **뷰어**로 공유합니다.
2. GitHub OIDC를 Google Cloud Workload Identity Federation에 연결합니다. 신뢰 조건은 이 저장소의 `main` 브랜치에서 실행되는 `.github/workflows/publications.yml`로 제한하고, 서비스 계정에 해당 연동 주체의 `roles/iam.workloadIdentityUser`를 부여합니다. [GitHub와 Google Cloud OIDC 연결](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-google-cloud-platform)
3. **Settings → Secrets and variables → Actions → Variables**에 `PUBLICATIONS_DRIVE_FOLDER_ID`, `PUBLICATIONS_DRIVE_WORKLOAD_IDENTITY_PROVIDER`(제공자 전체 리소스 이름), `PUBLICATIONS_DRIVE_SERVICE_ACCOUNT`(서비스 계정 이메일)를 등록합니다. Drive 연결 전에는 PubMed와 Crossref 수집부터 사용할 수 있습니다.

테스트용 폴더는 로컬 시험에서만 사용합니다. 로컬 수집 실행에는 `PUBLICATIONS_DRIVE_FOLDER_ID`와 Drive 읽기 권한이 있는 단기 토큰을 `PUBLICATIONS_DRIVE_ACCESS_TOKEN`으로 전달합니다. 확인이 필요한 PDF를 보고서의 `fileRef`와 대조할 때는 PDF 파일 ID의 SHA-256 해시 앞 16자리를 사용합니다.

## 링크 및 참고

-   **교수 상세 프로필:**\
    [<https://drkim.pusan.ac.kr/drkim/index.do>]

    -   메뉴에서 "교수소개" 클릭 시, 화면에 "교수 상세 프로필" 을 확인할 수 있습니다.

-   **의한협진모니터링센터:**\
    [<https://www.mcmc.re.kr/>]

-   **GitHub:**\
    [<https://github.com/kimnamkwen/BigCEREE>]
