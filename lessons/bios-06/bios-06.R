# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 6강. 기술통계 2
################################################################################

# 이 강의는 R 기본 함수만 사용하므로 별도 패키지가 필요 없습니다.

##### 기술통계 신뢰구간 계산

#### dnorm, pnorm, qnorm, rnorm 함수 설명

# dnorm : 확률밀도함수

dnorm(0, mean = 0, sd = 1)

# pnorm : 누적확률함수

pnorm(-1.96, mean = 0, sd = 1)

# qnorm : 분위수함수(quantile)

qnorm(0.5, mean = 0, sd = 1)
qnorm(0.95, mean = 0, sd = 1)
qnorm(0.975, mean = 0, sd = 1)
qnorm(0.025, mean = 0, sd = 1)

# rnorm : 난수생성함수(random)

rnorm(5, mean =0, sd =1)

# 6-1.모집단평균의 신뢰구간 : z 분포

# 환자들의 예약시간 지체를 조사함. 35명의 환자로 구성된 한 표본, 평균 시간은 17.2 분 이었다.
# 과거의 연구에 의하면 표준편차는 8분 정도 된다고 한다.
# 모집단의 분포는 정규분포가 아닌 것으로 판단되고 있다.
# 약속 지체 시간 μ의 90% 신뢰구간은 얼마인가?

stat6_1 <- function(n, mean, sigma, cipct){
  z = qnorm((cipct/100)+(100-cipct)/200, 0, 1)
  uci = mean + z*(sigma/sqrt(n))
  lci = mean - z*(sigma/sqrt(n))
  cat (cipct, "퍼센트 z=", z, "\n",
       cipct, "퍼센트 신뢰구간은", lci,",", uci)
}

stat6_1(35, 17.2, 8, 90)

# 문제 : 위의 문제에서 95%의 신뢰구간을 구하시오.

# 답안 :

stat6_1(35, 17.2, 8, 95)


# 6-2. 모집단평균의 신뢰구간 : t 분포

# 건강한 사람 15명으로 구성된 표본을 대상으로 혈청 아밀라아제 측정함.
# 평균 96단위/100ml이고 표준편차 35단위/100ml 인 정규분포 함.
# 모집단의 분산이 알려져 있지 않을 때 95% 신뢰구간은?

stat6_2 <- function(n, mean, sigma, cipct){
  t = qt((cipct/100)+(100-cipct)/200, n-1) # t분포 관련함수 : dt, pt, qt, rt
  uci = mean + t*(sigma/sqrt(n))
  lci = mean - t*(sigma/sqrt(n))
  cat (cipct, "퍼센트 t=", t, "\n",
       cipct, "퍼센트 신뢰구간은", lci,",", uci)

}

stat6_2(15, 96, 35, 95)

# 문제 : 위의 문제에서 90%의 신뢰구간을 구하시오.

# 답안 :

stat6_2(15, 96, 35, 90)

# 6-3. 모집단평균 차이의 신뢰구간 : z 분포 (모분산을 아는 경우)

# 정신지체아 치료병원에서 몽골리즘 환자 12명 표본의 혈청 요산의 평균은 4.5mg/100ml 이고,
# 동일연령 동일 성의 정상인 15명 표본의 혈청 요산의 평균은 3.4mg/100ml 임.
# 두 모집단은 분산이 1mg/100ml 로 동일하다면, 두 군 차이의 95% 신뢰구간은?

# 1. stat6_3 함수 정의 (모분산을 알고 있는 두 모집단의 평균 차이에 대한 신뢰구간)

stat6_3 <- function(x1_bar, n1, sigma1_sq, x2_bar, n2, sigma2_sq, cipct = 95) {

  # (1) 두 표본평균의 차이 계산
  mean_diff <- x1_bar - x2_bar

  # (2) 표준오차(Standard Error) 계산
  se <- sqrt((sigma1_sq / n1) + (sigma2_sq / n2))

  # (3) 누적확률식을 적용하여 양측 검정용 z 임계값 계산
  z <- qnorm((cipct/100) + (100-cipct)/200)

  # (4) 오차 한계(Margin of Error) 계산
  me <- z * se

  # (5) 신뢰구간 하한과 상한 계산
  lower_bound <- mean_diff - me
  upper_bound <- mean_diff + me

  # 결과 출력 및 벡터 형태로 반환
  result <- c(lower_bound, upper_bound)
  names(result) <- c("Lower Bound", "Upper Bound")

  return(result)
}

# 2. 생성된 stat6_3 함수를 이용하여 예제 문제 계산하기
# 문제 조건: x1_bar=4.5, n1=12, sigma1_sq=1, x2_bar=3.4, n2=15, sigma2_sq=1, cipct=95
ci_result <- stat6_3(
  x1_bar    = 4.5,
  n1        = 12,
  sigma1_sq = 1,
  x2_bar    = 3.4,
  n2        = 15,
  sigma2_sq = 1,
  cipct     = 95
)

ci_result

# 3. 소수점 자리수를 조절하여 이미지와 동일한 포맷으로 출력
cat("신뢰구간 = (", round(ci_result[1], 5), ",", round(ci_result[2], 4), ")\n")

# 문제 : 위의 문제에서 몽골리즘 표본은 20명, 건강인은 25명인 경우의 95% 신뢰구간은?

# 답안 :



##### 기본 그래프 함수

# Working directory

setwd("")
getwd()

vas <- read.csv("vas.csv")

attach(vas)

# 1. Histogram

hist(cost, main="Cost Histogram", xlab= "비용", col="skyblue")

# 2. Box plot

boxplot(vas_1 ~ treat,
        xlab = "Treatment",
        ylab = "vas1",
        main = "vas1 for Treatment",
        col = c("skyblue", "lightgreen"),
        names = c("Control", "Treatment")
        )

# 문제 : vas_1 of SES 의 boxplot 그래프를 그려보세요.

# 답안

boxplot(vas_1 ~ ses,
        xlab = "Socioeconomics",
        ylab = "vas1",
        main = "vas1 for SES",
        col = c("skyblue", "lightgreen","blue"),
        names = c("Group1", "Group2", "Group3")
)

# 3. scatter plot

plot(qol ~ cost)

lm <- lm(qol ~ cost)
abline(lm, col = "blue", lwd = 2)

plot(qol ~ cost,
     main = "QOL vs Cost",
     xlab = "Cost",
     ylab = "QOL")
abline(lm, col = "blue", lwd = 2)

coef <- coef(lm)
coef
intercept <- round(coef[1], 2)
slope     <- round(coef[2], 2)

eq <- paste("QOL = ", intercept, " + ", slope, " × Cost")

text(x = min(cost), y = max(qol), labels = eq, pos = 4, col = "blue", cex = 1.1)

# 문제 : vas_1(x축) 과 vas_2(y축) 의 scatter plot을 그려 보세요.

# 답안

plot(vas_2 ~ vas_1)

detach(vas)
