# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 12강. 범주형 자료분석 · 로지스틱 회귀분석
################################################################################

# 이 강의는 R 기본 함수(stats)만 사용하므로 별도 패키지가 필요 없습니다.
# (confint 결과를 Wald 방식으로 보려면 confint.default 를 사용합니다.)

# Working directory

setwd("")

getwd()

vas <- read.csv("vas.csv")

head(vas)

str(vas)

################################################################################
# 12-1. 범주형 자료분석
################################################################################

##### 1. 적합도 검정

### 1-1. 주사위 실험

# 주사위를 60번 던진 결과
observed <- c(4, 10, 7, 12, 9, 18)

# 기대되는 각 면의 빈도 (공정한 주사위라면 각 면이 나올 확률이 1/6)
expected <- rep(10, 6)

pe <- expected/sum(expected)

po <- observed/sum(observed)

# 카이제곱 적합도 검정 수행

chi <- (4-10)^2/10 + (7-10)^2/10 + (10-10)^2/10 +
  (12-10)^2/10 + (9-10)^2/10 + (18-10)^2/10

chi

p_value <- 1 - pchisq(chi, df = 5)

p_value

# 결과
# p-value가 0.05보다 크면 주사위 실험 결과의 분포는 균등분포(uniform distribution)에 적합

chisq.test(observed, p = pe)

### 1-2. 병상 이용률 실험

# 병상이용률

bed_use <- c("0-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99", "100-109")
hospitals <- c(16, 18, 22, 81, 62, 55, 22, 4)  # 각 구간의 빈도수

# 각 구간의 중간값 계산
midpoints <- c(19.5, 44.5, 54.5, 64.5, 74.5, 84.5, 94.5, 104.5)

# 전체 데이터의 평균과 표준편차 계산
total_frequencies <- sum(hospitals)
mean_bed_use <- sum(midpoints * hospitals) / total_frequencies
std_dev_bed_use <- sqrt(sum((midpoints - mean_bed_use)^2 * hospitals) / total_frequencies)

mean_bed_use  # 평균
std_dev_bed_use  # 표준편차

# 정규분포의 누적분포함수를 사용하여 각 구간의 확률 계산
prob_intervals <- pnorm(c(39.5, 49.5, 59.5, 69.5, 79.5, 89.5, 99.5, 109.5), mean=mean_bed_use, sd=std_dev_bed_use) -
  pnorm(c(-0.5, 39.5, 49.5, 59.5, 69.5, 79.5, 89.5, 99.5), mean=mean_bed_use, sd=std_dev_bed_use)

# 기대 도수 계산
expected_frequencies <- total_frequencies * prob_intervals
expected_frequencies  # 기대 도수

# 카이제곱 검정 수행
chisq_test <- chisq.test(hospitals, p=prob_intervals, rescale.p=TRUE)
chisq_test


##### 2. 독립성 검정 : 치료군(treat)과 성별(sex)

# Contingency table

ctable <- table(vas$treat, vas$sex)

ctable

# Chi square test

chi1 <- chisq.test(ctable)

chi1

chi1$observed

chi1$expected

# Fisher's exact test

fisher1 <- fisher.test(ctable)
fisher1

################################################################################
# 12-2. Logistic regression analysis
################################################################################

attach(vas)

# Logistic regression analysis

vasdiff <- vas_1 - vas_2   # 통증 개선량 (VAS는 낮을수록 좋음)

summary(vasdiff)

sd(vasdiff)

vas$recovery <- ifelse(vasdiff >mean(vasdiff), 1, 0)   # 평균보다 많이 개선되면 회복(1)

head(vas$recovery)

table(vas$recovery, vas$treat)

plot(vas$id, vas$recovery)

logitfit <- glm(recovery ~ treat, family = binomial(link = "logit"), data=vas)

summary(logitfit)

summary(logitfit)$coefficients

exp(logitfit$coefficients["treat"])

confint(logitfit)

confint(logitfit)[2,]

exp(confint(logitfit)[2,])

detach(vas)
