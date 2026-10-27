# Contemporary Demographic Transition (CDT) Validation Audit

**Evaluation Dataset**: Project 1509 SVEA / Histmap (Stadestér Demographics, Raw MNL, PAVA/Whittaker smoothing)
**Priors**: Human Mortality Database (HMD), UNWPP, Niva et al. (Kummu)

---

## 1. Age/Sex Validation (MNL vs Clamped to Stadestér)

Evaluates the goodness-of-fit ($R^2$) of the raw Multinomial Logit (MNL) baseline probabilities against the final Stadestér age/sex output (post-PAVA, Whittaker graduation, and clamping) using HMD and UNWPP empirical benchmarks.

### Overall Performance
- **Raw MNL Geomean $R^2$**: $0.4625$
- **Clamped Geomean $R^2$**: $0.6092$
- **Improvement ($\Delta R^2$)**: $+0.1466$

### Table 1: Age/Sex $R^2$ Validation by Epoch
| Year | Empirical Source | Sample ($N$ Countries) | Raw MNL $R^2$ | Clamped $R^2$ (Stadestér) | $\Delta R^2$ (Improvement) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1850** | HMD | $8$ | $0.8138$ | **$0.8525$** | **$+0.0386$** |
| **1900** | HMD | $11$ | $0.7849$ | **$0.8505$** | **$+0.0656$** |
| **1920** | HMD | $12$ | $0.8476$ | **$0.8736$** | **$+0.0260$** |
| **1940** | HMD | $16$ | $0.6360$ | **$0.8140$** | **$+0.1780$** |
| **1950** | UNWPP | $189$ | $0.5219$ | **$0.6717$** | **$+0.1498$** |
| **1980** | UNWPP | $189$ | $0.4454$ | **$0.6549$** | **$+0.2095$** |
| **2000** | UNWPP | $189$ | $0.3467$ | **$0.5357$** | **$+0.1890$** |
| **2010** | UNWPP | $189$ | $0.2718$ | **$0.3716$** | **$+0.0999$** |
| **2019** | UNWPP | $189$ | $0.1285$ | **$0.2558$** | **$+0.1273$** |

---

## 2. Births & Deaths Validation (Proxy Residuals vs Empirical)

Evaluates proxy birth and death counts against UNWPP and Niva et al. (Kummu) empirical data. The error percentage reflects the discrepancy between inferred proxy natural events and actual historical statistics.

### Table 2: Global Births and Deaths Accuracy by Epoch
| Year | Source | Sample ($N$) | Proxy Births | Empirical Births | Births Error | Proxy Deaths | Empirical Deaths | Deaths Error |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1950** | UNWPP | $159$ | $77,447,222$ | $90,796,000$ | **$-14.70\%$** | $53,804,809$ | $45,876,000$ | **$+17.28\%$** |
| **1980** | UNWPP | $154$ | $98,930,815$ | $125,643,000$ | **$-21.26\%$** | $58,488,145$ | $44,926,000$ | **$+30.19\%$** |
| **2000** | Kummu + UNWPP | $189$ | $168,968,026$ | $148,236,044$ | **$+13.99\%$** | $39,285,304$ | $62,117,731$ | **$-36.76\%$** |
| **2010** | Kummu + UNWPP | $189$ | $129,465,460$ | $147,158,331$ | **$-12.02\%$** | $58,529,214$ | $62,539,366$ | **$-6.41\%$** |
| **2019** | Kummu + UNWPP | $189$ | $136,580,269$ | $146,680,142$ | **$-6.89\%$** | $57,388,647$ | $66,557,827$ | **$-13.78\%$** |

---

*Generated autonomously by Project 0717 Velkscala / Project 1509 SVEA Contemporary Demographic Transition Validation Engine.*