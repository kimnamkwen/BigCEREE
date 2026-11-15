# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 14강. 비모수검정 (Non parametric analyses)
################################################################################

# 이 강의는 R 기본 함수(stats)만 사용하므로 별도 패키지가 필요 없습니다.

##### 1. Data

setwd("")

getwd()

vas <- read.csv("vas.csv")

head(vas)

str(vas)

vasdiff <- vas$vas_1 - vas$vas_2   # 통증 개선량 (VAS는 낮을수록 좋음)

# sample size estimate for G power program

t.test(vasdiff ~ vas$treat)
sd(vasdiff[vas$treat==0])
sd(vasdiff[vas$treat==1])

##### 2. Sign test : One sample mean test (소표본 20명)

NROW(vas$age)

set.seed(123)                              # 같은 표본이 뽑히도록 난수 고정
nparvas <- vas[sample(nrow(vas), 20), ]    # 20명 무작위 추출

NROW(nparvas)

shapiro.test(nparvas$age)

t.test(nparvas$age, mu=24)

wilcox.test(nparvas$age, mu=24)

# 이후 검정은 모두 20명 소표본(nparvas)으로 수행합니다.

nparvas$diff <- nparvas$vas_1 - nparvas$vas_2   # 통증 개선량

##### 3. Signed rank test : Paired-t test

wilcox.test(nparvas$vas_1, nparvas$vas_2, paired = TRUE)

##### 4. Rank sum test : Independent t test

wilcox.test(nparvas$diff ~ nparvas$treat)

wilcox.test(nparvas$diff ~ nparvas$treat, alternative = "two.sided", exact=F)

##### 5. Kruskal Wallis : ANOVA

table(nparvas$ses)

kruskal.test(nparvas$diff ~ nparvas$ses)

##### 6. Spearman rank correlation : Pearson correlation

cor.test(nparvas$qol, nparvas$vas_1)

cor.test(nparvas$qol, nparvas$vas_1, method = "kendall")

cor.test(nparvas$qol, nparvas$vas_1, method = "spearman")

cor.test(nparvas$qol, nparvas$vas_1, method = "spearman", exact = F)

rm(list=ls())
