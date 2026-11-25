const economicResearchSections = [
  {
    key: 'trial-based-evaluation',
    label: '임상연구 병행 경제성평가',
    theory: '임상연구에 참여한 환자의 건강 결과와 비용을 같은 추적 기간에 수집해 중재군과 비교군을 비교합니다. 비용에 포함할 항목은 건강보험자, 환자, 사회 등 분석 관점에 따라 달라집니다. 비용효용분석에서는 추가 비용을 추가로 얻은 질보정수명(QALY)으로 나누어 한 단위의 건강 개선에 드는 비용을 추정합니다.',
    caseTitle: '요추 수술 후 통증 환자의 전침 병행 치료',
    question: '요추 수술 후 지속되는 통증에 통상 치료와 전침을 병행하면 통상 치료만 받는 경우보다 건강 개선에 비용이 얼마나 더 드는가?',
    method: '무작위배정 임상시험의 두 치료군을 24주 동안 비교했습니다. 삶의 질과 의료비, 비의료비, 생산성 손실을 추적했습니다.',
    result: '사회적 관점에서 전침 병행 치료의 점증적 비용효과비(ICER)는 QALY당 약 705만 원이었습니다.',
    interpretation: '이 추정치는 해당 임상시험에 참여한 환자의 24주 관찰 결과에 근거합니다.',
    paper: publicationCatalog.find(paper => paper.doi === '10.3390/su12125033'),
    related: {
      paper: publicationCatalog.find(paper => paper.pmid === '33341226'),
      note: '경제성평가와 같은 임상시험에서 통증과 기능을 평가한 결과입니다.',
    },
  },
  {
    key: 'model-based-evaluation',
    label: '모델링 경제성평가',
    theory: '임상시험, 문헌, 통계자료를 모형에 결합해 치료 대안별 비용과 건강 결과를 추정합니다. 마르코프 모형은 건강 상태 사이를 이동할 확률을 이용해 임상시험 추적 기간보다 긴 시간에 걸친 결과를 계산할 수 있습니다. 민감도 분석으로 주요 가정을 바꿨을 때 결론이 얼마나 달라지는지 확인합니다.',
    caseTitle: '무릎 골관절염 환자의 침 치료 병행 효과',
    question: '국내 경증·중등도 무릎 골관절염 여성 환자가 통상 치료와 침 치료를 병행하면 10년간 비용과 건강 결과가 어떻게 달라지는가?',
    method: '통상 치료와 침 병행 치료를 비교했습니다. 임상시험, 공공 통계, 선행연구를 6개월 주기의 마르코프 모형에 적용했습니다.',
    result: '제한적 사회적 관점에서 기본 분석의 ICER는 QALY당 11,085달러였습니다.',
    interpretation: '비용효과적일 확률 약 70%는 연구에서 설정한 기준인 QALY당 20,000달러와 모형 가정에 따른 값입니다.',
    paper: publicationCatalog.find(paper => paper.pmid === '37664453'),
    related: {
      paper: {
        title: 'Acupuncture and knee osteoarthritis: a three-armed randomized trial',
        authors: 'Scharf HP 외',
        journal: 'Annals of Internal Medicine',
        year: 2006,
        doi: '10.7326/0003-4819-145-1-200607040-00005',
      },
      note: '모형에서 침 병행 치료의 효과를 추정할 때 사용한 임상시험 중 하나입니다.',
    },
  },
  {
    key: 'budget-impact-analysis',
    label: '재정추계분석',
    theory: '건강보험 같은 지불자 관점에서 새 치료를 도입할 때 연도별 예산이 얼마나 달라지는지 추정합니다. 대상 환자 수, 예상 도입률, 환자당 비용을 반영해 현행 시나리오와 도입 시나리오를 비교합니다. 도입률이나 가격을 달리한 시나리오로 예산에 미치는 영향을 살펴봅니다.',
    caseLabel: '외부 연구 사례',
    caseTitle: '면역항암제의 급여 범위 확대에 따른 재정영향',
    question: '면역항암제의 새 적응증에 급여를 적용할 때 가격 책정 방식에 따라 보험자 예산이 어떻게 달라지는가?',
    method: '예상 환자 수와 연간 치료비를 이용해 지불자 관점에서 3년간의 비용을 추정했습니다. 시장점유율을 연도별로 30%, 40%, 50%로 가정해 세 가지 가격 책정 방식을 비교했습니다.',
    result: '세 가지 방식 중 적응증별 가치를 환급률에 반영한 시나리오의 추정 재정영향이 가장 작았습니다.',
    interpretation: '결과는 연구에서 설정한 급여 범위, 시장점유율과 가격 가정을 적용한 시나리오별 추정치입니다.',
    paper: {
      year: 2022,
      title: 'Value-Based Pricing and Budget Impact Analysis for Multi-Indication Drugs: A Case Study of Immunotherapies',
      authors: 'Ha SY, Kang DW, Jung HI, Lee EK, Park MH',
      journal: 'International Journal of Environmental Research and Public Health',
      doi: '10.3390/ijerph19074105',
    },
    related: {
      paper: {
        title: 'Budget Impact Analysis of the Change in Peritoneal Dialysis Use Rate in Korea',
        authors: 'Kim J 외',
        journal: 'Peritoneal Dialysis International',
        year: 2019,
        doi: '10.3747/pdi.2018.00037',
      },
      note: '국내 건강보험 자료를 활용해 복막투석 이용률별 지출을 추정한 외부 사례입니다.',
    },
  },
].map(({ key, label, theory, caseLabel = '대표 논문', caseTitle, question, method, result, interpretation, paper, related }) => ({
  key,
  permalink: key,
  label,
  content: `
    <h3>${label}</h3>
    <p>${theory}</p>
    <section class="research-case">
      <header class="research-case-heading">
        <div class="research-case-label">${caseLabel}</div>
        <h4>${caseTitle}</h4>
      </header>
      <dl class="research-case-details">
        <div><dt>연구 질문</dt><dd>${question}</dd></div>
        <div><dt>설계와 비교군</dt><dd>${method}</dd></div>
        <div><dt>핵심 결과</dt><dd>${result}</dd></div>
        <div><dt>해석 범위</dt><dd>${interpretation}</dd></div>
      </dl>
      <div class="research-reference">${researchPaperCitation(paper)}</div>
    </section>
    <section class="related-research">
      <h4>관련 논문</h4>
      <div class="research-reference">${researchPaperCitation(related.paper)}</div>
      <p>${related.note}</p>
    </section>
  `,
}));

function researchPaperCitation(paper) {
  return `<a href="https://doi.org/${paper.doi}" lang="en">${paper.title}</a>
    <div class="publication-authors">${paper.authors} · <i lang="en">${paper.journal}</i> · ${paper.year}</div>`;
}
