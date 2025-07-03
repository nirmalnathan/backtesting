# NIFTY Pivot Point Detection System

## Overview
This system implements the Structural Pivots Method (SPM) for detecting Small Pivot Highs (SPH), Small Pivot Lows (SPL), Large Pivot Highs (LPH), and Large Pivot Lows (LPL) in market data.

## Core Algorithm Rules

### 1. Three-Bar Detection Pattern

Every pivot detection requires exactly **3 bars**: Anchor, B1, and B2

#### For Small Pivot High (SPH):
- **Anchor**: Any bar being tested as potential pivot
- **B1**: First bar after Anchor with **lower low** AND **lower close** than Anchor
- **B2**: Second bar after Anchor with **lower low** AND **lower close** than Anchor
- **Pivot Location**: The bar with **highest high** among Anchor, B1, and B2

#### For Small Pivot Low (SPL):
- **Anchor**: Any bar being tested as potential pivot  
- **B1**: First bar after Anchor with **higher high** AND **higher close** than Anchor
- **B2**: Second bar after Anchor with **higher high** AND **higher close** than Anchor
- **Pivot Location**: The bar with **lowest low** among Anchor, B1, and B2

### 2. Bar Spacing Rules

**IMPORTANT**: Anchor, B1, and B2 can have ANY spacing between them:
- ✅ **Consecutive**: A=1, B1=2, B2=3
- ✅ **Gaps**: A=1, B1=4, B2=7  
- ✅ **Mixed**: A=5, B1=6, B2=9

### 3. Search Progression Rules

After detecting a pivot with bars (Anchor, B1, B2):
1. **Next search starts from B2 position**
2. **B2 may or may not become the next Anchor**
3. **Test each bar starting from B2** until valid pattern found

## Detailed Examples

### Example 1: B2 Becomes Next Anchor
```
Bars:     [1] [2] [3] [4] [5] [6] [7] [8]
Values:   100  95  90  85  80  85  90  95

Step 1: Test Bar 1 as Anchor
- Anchor=1 (high=100)
- B1=2 (low=95, close=95) ✓ lower than anchor
- B2=3 (low=90, close=90) ✓ lower than anchor
- Result: SPH marked at Bar 1 (highest among 1,2,3)

Step 2: Start search from Bar 3 (B2 position)
- Test Bar 3 as Anchor
- Anchor=3 (low=90)  
- B1=6 (high=85, close=85) ✓ higher than anchor
- B2=7 (high=90, close=90) ✓ higher than anchor
- Result: SPL marked at Bar 3 (lowest among 3,6,7)
```

### Example 2: B2 is NOT Next Anchor
```
Bars:     [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
Trend:    ↓   ↓   ↓   ↓   ↓   ↓   ↓   ↑   ↑   ↑

Step 1: Test Bar 1 as Anchor
- Pattern found: A=1, B1=2, B2=3
- SPH marked, next search from Bar 3

Step 2: Test Bar 3 as Anchor  
- No qualifying B1/B2 found (trend continues down)

Step 3: Test Bar 4 as Anchor
- No qualifying B1/B2 found (trend continues down)

...continue testing until...

Step 8: Test Bar 8 as Anchor
- Pattern found: A=8, B1=9, B2=10  
- SPL marked at appropriate bar
```

### Example 3: Non-Consecutive Pattern
```
Bars:     [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
Highs:    100  98  96  94  92  90  88  86  84  82
Lows:     95   93  91  89  87  85  83  81  79  77

Test Bar 1 as Anchor (high=100):
- B1 = Bar 4 (first bar with low < 95 AND close < anchor.close)
- B2 = Bar 7 (second bar with low < 95 AND close < anchor.close)
- SPH marked at Bar 1 (highest among bars 1, 4, 7)
- Next search starts from Bar 7
```

### Example 4: Mixed Consecutive/Non-Consecutive
```
Detection 1: A=5, B1=6, B2=9 (consecutive A,B1 then gap to B2)
Detection 2: A=9, B1=12, B2=15 (gaps between all bars)  
Detection 3: A=15, B1=16, B2=17 (all consecutive)
```

## Small Pivot Rules Summary

### ✅ Allowed:
- Any spacing between Anchor, B1, B2
- B2 becoming next Anchor
- B2 NOT becoming next Anchor
- Consecutive or non-consecutive patterns
- Natural market rhythm determines spacing

### ❌ Not Allowed:
- Both SPH and SPL on same bar
- Skipping the B2 position in search progression
- Using B1 from previous detection in next detection

## Large Pivot Detection Rules

### Large Pivot High (LPH):
**Trigger**: When an SPL breaks below a previous SPL level
**Action**: Mark the highest SPH between the last LPL and the breaking SPL as LPH

### Large Pivot Low (LPL): 
**Trigger**: When an SPH breaks above a previous SPH level
**Action**: Mark the lowest SPL between the last LPH and the breaking SPH as LPL

### Large Pivot Examples:

```
SPL Sequence: SPL1(low=100) → SPL2(low=95) → SPL3(low=90)
When SPL3 breaks below SPL2: Find highest SPH between them → Mark as LPH

SPH Sequence: SPH1(high=200) → SPH2(high=205) → SPH3(high=210)  
When SPH3 breaks above SPH2: Find lowest SPL between them → Mark as LPL
```

## Algorithm Flow

1. **Initialize** search from Bar 0
2. **For each potential Anchor** starting from search position:
   - Look for qualifying B1 after Anchor
   - Look for qualifying B2 after B1  
   - If pattern complete: Mark pivot, set next search to B2
   - If no pattern: Test next bar as Anchor
3. **Apply alternation** rule (SPH→SPL→SPH→SPL)
4. **Update to extremes** in ranges (dynamic small pivots)
5. **Detect large pivots** based on break conditions
6. **Return results**: {sph: [], spl: [], lph: [], lpl: []}

## Key Features

- **Natural Market Flow**: Algorithm follows actual market structure
- **Proper Spacing**: No artificial constraints on bar distances  
- **Trend Following**: Detects pivots where trends actually change
- **Dynamic Updates**: Small pivots update to true extremes in ranges
- **Permanent Large