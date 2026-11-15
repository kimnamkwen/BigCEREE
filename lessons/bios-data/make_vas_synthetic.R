# BigCEREE 보건의료통계학 합성 실습 자료(vas.csv) 생성 코드
# 실제 환자 자료가 아닌 난수로 만든 자료입니다. 선택된 seed = 6
mk <- function(seed) {
  set.seed(seed); n <- 60
  treat <- rep(c(0, 1), each = n / 2); sex <- rbinom(n, 1, 0.5); age <- round(runif(n, 20, 65))
  ses <- sample(1:3, n, replace = TRUE, prob = c(0.3, 0.4, 0.3))
  vas_1 <- pmin(pmax(round(rnorm(n, 6 + 0.4 * (ses == 1) - 0.4 * (ses == 3), 1.2)), 1), 10)
  vas_2 <- pmin(pmax(round(vas_1 - (0.8 + 1.0 * treat) + rnorm(n, 0, 1.5)), 0), 10)
  qol <- round(pmin(pmax(0.95 - 0.04 * vas_2 + 0.02 * (ses - 2) + rnorm(n, 0, 0.06), 0.3), 1), 9)
  cost <- round(exp(rnorm(n, log(280000) + 0.25 * treat + 0.6 * (qol - 0.75), 0.35)))
  data.frame(id = 1:n, treat, sex, age, ses, cost, qol, vas_1, vas_2)
}
best <- NULL
for (s in 1:400) {
  v <- mk(s); imp <- v$vas_1 - v$vas_2; r <- as.integer(imp > mean(imp)); tb <- table(r, v$treat)
  if (any(tb < 6)) next
  f <- glm(r ~ treat, binomial, v); OR <- exp(coef(f))[2]; p <- summary(f)$coef[2, 4]
  pa <- summary(aov(vas_1 ~ factor(ses), v))[[1]][1, 5]; ct <- cor(v$qol, v$cost)
  if (OR > 3 && OR < 8 && p < 0.03 && pa < 0.1 && ct > 0.2 && abs(mean(v$sex) - 0.5) < 0.1) { best <- s; break }
}
cat("seed", best, "\n"); v <- mk(best); write.csv(v, "vas.csv", row.names = FALSE, quote = FALSE)
imp <- v$vas_1 - v$vas_2; r <- as.integer(imp > mean(imp)); print(table(recovery = r, treat = v$treat))
f <- glm(r ~ treat, binomial, v); print(round(c(OR = unname(exp(coef(f))[2]), p = summary(f)$coef[2, 4]), 4))
print(round(c(age_t = t.test(age ~ treat, v)$p.value, paired = t.test(v$vas_1, v$vas_2, paired = TRUE)$p.value,
  anova_ses = summary(aov(vas_1 ~ factor(ses), v))[[1]][1, 5], cor_qol_cost = cor(v$qol, v$cost),
  wilcox = wilcox.test(imp ~ v$treat, exact = FALSE)$p.value, chisq_sex = chisq.test(table(v$treat, v$sex))$p.value), 4))
print(table(v$treat, v$vas_2))
