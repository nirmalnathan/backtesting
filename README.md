# NIFTY Pivot Point Detection System

## Overview
This system implements the Structural Pivots Method (SPM) for detecting Small Pivot Highs (SPH), Small Pivot Lows (SPL), Large Pivot Highs (LPH), and Large Pivot Lows (LPL) in market data using a **Parallel Anchor Testing** approach.

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

### 3. **NEW: Parallel Anchor Testing Algorithm**

**Revolutionary Approach**: Instead of testing one anchor at a time against all remaining bars, we test multiple potential anchors simultaneously as new bars arrive.

#### How It Works:

1. **Start with first anchor** after previous pivot
2. **Add new potential anchors** as each bar arrives
3. **Test all existing anchors** against each new bar
4. **First complete A,B1,B2 pattern wins**

#### Example Flow:

```
After SPH at bar 8, start looking for SPL:

Bar 10 arrives:
  - Test anchor 9 (no B1 found yet)
  - Add anchor 10 to potential list

Bar 11 arrives:  
  - Test anchor 9 (no B1 found yet)
  - Test anchor 10 (no B1 found yet)
  - Add anchor 11 to potential list

Bar 12 arrives:
  - Test anchor 9 (no B1 found yet)
  - Test anchor 10 (no B1 found yet) 
  - Test anchor 11 (no B1 found yet)
  - Add anchor 12 to potential list

Bar 13 arrives:
  - Test anchor 9 (no complete pattern)
  - Test anchor 10 (no complete pattern)
  - Test anchor 11 (no complete pattern)
  - Test anchor 12 (B1=13 found, need B2)
  - Add anchor 13 to potential list

Bar 14 arrives:
  - Test anchor 9 (no complete pattern)
  - Test anchor 10 (no complete pattern)
  - Test anchor 11 (no complete pattern)
  - Test anchor 12 (B1=13, B2=14 - COMPLETE!) ✓
  - SPL confirmed at bar 12!
```

### 4. Key Benefits of Parallel Testing

#### ✅ **Immediate Trend Detection**
- Catches reversals at the actual turning point
- No delayed detection due to waiting for distant patterns

#### ✅ **Natural Market Flow**
- Follows actual market structure
- No arbitrary range limitations

#### ✅ **Non-Sequential Pattern Support**
- Handles patterns like A=12, B1=15, B2=18 (gaps at 13,14,16,17)
- Takes first qualifying bar for B1, first qualifying bar after B1 for B2

#### ✅ **Eliminates False Patterns**
- No more situations where algorithm finds distant B1/B2 while missing immediate reversals
- Solves the "bar 129 vs bar 218" type discrepancies

### 5. Alternation Rules

- **First pivot**: Always SPH (gives head start)
- **Strict alternation**: SPH → SPL → SPH → SPL → ...
- **Pattern completion**: Only confirmed when complete A,B1,B2 found

### 6. Search Progression Rules

After detecting a pivot with bars (Anchor, B1, B2):
1. **Next search starts from B2 position**
2. **Begin parallel testing** of all subsequent bars as potential anchors
3. **First complete pattern** determines next pivot

## Detailed Examples

### Example 1: Immediate Reversal Detection
```
Bars:     [8] [9] [10] [11] [12] [13] [14] [15]
Pattern:   SPH ↓   ↓    ↓    ↓    ↑    ↑    ↑

Traditional approach: Tests bar 9 against all bars 10-440
Parallel approach: Tests bars 9,10,11,12 simultaneously
Result: SPL found at bar 12 when bar 14 arrives (A=12, B1=13, B2=14)
```

### Example 2: Non-Sequential Pattern
```
Bars:     [10] [11] [12] [13] [14] [15] [16] [17] [18]
Anchor=10: ↓    ↓    ↓    ↑    ↓    ↓    ↑    ↓    ↑

When bar 18 arrives:
- B1 = bar 13 (first higher high + higher close after anchor 10)
- B2 = bar 16 (first higher high + higher close after B1=13)  
- SPL at bar 10 (lowest among 10,13,16)
- Gaps: bars 11,12,14,15,17 don't qualify but don't break pattern
```

### Example 3: Multiple Anchor Competition
```
Potential anchors: [9, 10, 11, 12]
When bar 15 arrives:
- Anchor 9: No valid B1 found
- Anchor 10: No valid B1 found
- Anchor 11: B1=14, B2=15 → Complete pattern! ✓
- Anchor 12: Still testing...

Winner: Anchor 11 (first to complete)
```

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
2. **Form first pivot** (always SPH)
3. **Start parallel anchor testing** from next position
4. **For each new bar arrival**:
   - Test all existing potential anchors
   - Add current bar as new potential anchor
   - If any anchor completes A,B1,B2: confirm pivot
5. **Apply alternation** rule (SPH→SPL→SPH→SPL)
6. **Detect large pivots** based on break conditions
7. **Return results**: {sph: [], spl: [], lph: [], lpl: []}

## Key Features

- **Parallel Processing**: Tests multiple anchors simultaneously
- **Natural Market Flow**: Algorithm follows actual market structure
- **Proper Spacing**: No artificial constraints on bar distances  
- **Immediate Detection**: Catches trend reversals at actual turning points
- **Non-Sequential Support**: Handles gaps in A,B1,B2 patterns naturally
- **Eliminates Discrepancies**: No more "detected vs displayed" pivot mismatches

## Performance Benefits

- **Faster Detection**: Finds reversals immediately when they occur
- **More Accurate**: Eliminates false long-range patterns
- **Consistent Results**: Visual chart matches algorithm output
- **Robust Pattern Handling**: Works with any bar spacing naturally

## Usage

```javascript
const pivotData = detectPivots(chartData);
// Returns: { sph: [2, 8, 45], spl: [12, 32], lph: [45], lpl: [32] }
```

## Important Notes

- **First Pivot Rule**: Always starts with SPH to establish trend direction
- **Pattern Priority**: First complete A,B1,B2 pattern wins when multiple anchors compete
- **Memory Efficiency**: Only tracks active potential anchors, cleans up invalid ones
- **Real-time Ready**: Algorithm works bar-by-bar as new data arrives