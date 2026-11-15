# 보건의료통계학 - 부산대학교 김남권 교수

################################################################################
# 13강. 생존분석
################################################################################

library(survival)   # Surv, survdiff, survfit, coxph, cox.zph
library(survminer)  # ggsurvplot, ggforest

# 이 강의의 자료(leukemia)는 코드 안에서 직접 만들므로 데이터 파일이 필요 없습니다.

##### 1. Data

# Leukemia data 분석

leukemia <- data.frame(
  id = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 
         22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42),
  rx = c(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
         1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
  survt = c(17, 22, 12, 11, 8, 1, 15, 2, 8, 1, 12, 5, 8, 5, 4, 8, 11, 4, 3, 2, 23, 
            7, 6, 10, 32, 6, 16, 13, 11, 34, 22, 6, 32, 6, 17, 20, 23, 25, 9, 19, 10, 35),
  status = c(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 
             1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0),
  sex = c(0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 
          0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1),
  logwbc = c(2.95, 2.73, 3.06, 3.49, 3.05, 5, 2.3, 4.91, 3.26, 2.8, 1.5, 3.97, 
             3.52, 3.49, 2.42, 2.32, 2.12, 4.36, 4.01, 4.48, 1.97, 4.43, 2.31, 2.96, 
             2.53, 3.2, 3.6, 2.88, 2.6, 1.47, 2.32, 3.28, 2.2, 4.06, 2.16, 2.01, 2.57, 
             1.78, 2.8, 2.05, 2.7, 1.45),
  lwbc3 = c(2, 2, 3, 3, 3, 3, 1, 3, 3, 2, 1, 3, 3, 3, 2, 2, 1, 3, 3, 3, 1, 
            3, 2, 2, 2, 3, 3, 2, 2, 1, 2, 3, 3, 1, 2, 1, 2, 2, 1, 2, 1, 3)
)

# -----------------------------
# 2. 4주 단위 구간 만들기
# -----------------------------
max_time <- max(leukemia$survt)
breaks <- seq(0, max_time + 4, by = 4)

# -----------------------------
# 3. Life Table 계산 함수 정의
# -----------------------------
make_life_table <- function(df, breaks) {
  
  # 구간별 사망 수
  deaths <- hist(df$survt[df$status == 1],
                 breaks = breaks, plot = FALSE)$counts
  
  # 구간별 검열 수
  cens <- hist(df$survt[df$status == 0],
               breaks = breaks, plot = FALSE)$counts
  
  # 구간 시작 시점 위험집단 수
  n_risk <- numeric(length(deaths))
  n_risk[1] <- nrow(df)
  for (i in 2:length(deaths)) {
    n_risk[i] <- n_risk[i-1] - deaths[i-1] - cens[i-1]
  }
  
  # 생명표 공식
  q <- deaths / (n_risk - cens/2)   # 구간 사망률
  p <- 1 - q                        # 구간 생존률
  S <- cumprod(p)                   # 누적 생존함수
  
  return(data.frame(
    interval_start = head(breaks, -1),
    interval_end   = tail(breaks, -1),
    n_risk = n_risk,
    deaths = deaths,
    censored = cens,
    q = round(q, 4),
    p = round(p, 4),
    survival = round(S, 4)
  ))
}

# -----------------------------
# 4. 그룹별 Life Table 생성
# -----------------------------
leuk_0 <- subset(leukemia, rx == 0)
leuk_1 <- subset(leukemia, rx == 1)

lt_0 <- make_life_table(leuk_0, breaks)
lt_1 <- make_life_table(leuk_1, breaks)

lt_0   # rx=0 생명표
lt_1   # rx=1 생명표

# -----------------------------
# 5. 두 그룹 Life Table Survival Curve 비교 + p-value 추가
# -----------------------------
plot(lt_0$survival, type="s", col="blue", lwd=2, ylim=c(0,1),
     xlab="4-week interval", ylab="Survival probability",
     main="Life Table Survival Curve by Treatment Group")

lines(lt_1$survival, type="s", col="red", lwd=2)

legend("bottomleft",
       legend=c("rx=0 (Control)", "rx=1 (Treatment)"),
       col=c("blue","red"), lwd=2, lty=1)

# -----------------------------
# 6. log-rank test
# -----------------------------
surv_obj <- Surv(leukemia$survt, leukemia$status)
fit <- survdiff(surv_obj ~ rx, data = leukemia)
chi_sq <- fit$chisq
p_value <- 1 - pchisq(chi_sq, df=1)

# -----------------------------
# 그래프 오른쪽 위에 chi-square & p-value 표시
# -----------------------------
text(
  x = max(1:length(lt_0$survival)) * 0.70,   # x 위치 (그래프 오른쪽)
  y = 0.90,                                   # y 위치 (상단)
  labels = paste0("Chi-square = ", round(chi_sq, 3), 
                  "\nP-value = ", signif(p_value, 3)),
  adj = 0,
  cex = 0.9
)

# 2. Kaplan-Meier 추정 (두 그룹 간 생존곡선 비교)

km_fit <- survfit(Surv(survt, status) ~ rx, data = leukemia)

summary(km_fit)

plot(km_fit, 
     main = "Life Table Survival Curve by Treatment Group", 
     xlab = "Time", 
     ylab = "Survival Probability", 
     col = c("blue", "red"),
     lty = 1) # 선 스타일 설정

legend("topright", legend = c("Rx0", "Rx1"), col = c("blue", "red"), lty = 1) # 범례 추가

ggsurvplot(km_fit, data=leukemia, conf.int = TRUE, pval = TRUE, fun = "pct", risk.table = TRUE,
           size = 1, linetype = "strata", palette = c("#E7B800", "#2E9FDF"),
           legend = "bottom", legend.title = "Treatment", legend.labs = c("Tx=0", "Tx=1"))

survdiff(Surv(survt, status) ~ rx, data = leukemia)


# 3. Cox 비례위험모델 (Cox Proportional Hazards Model)

cox_fit <- coxph(Surv(survt, status) ~ rx + sex + logwbc, data = leukemia)

summary(cox_fit)

ph_assumption <- cox.zph(cox_fit)

print(ph_assumption)

plot(ph_assumption, var = "rx")
plot(ph_assumption, var = "sex")
plot(ph_assumption, var = "logwbc")

ggforest(cox_fit, data=leukemia)
