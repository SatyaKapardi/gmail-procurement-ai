# Sample Output - Unified Price Analyzer

This document shows example outputs from the Unified Price Analyzer system demonstrating retail, wholesale, and commodity price analysis.

---

## Example 1: Commodity Analysis - Oil

```bash
$ python3 unified_price_analyzer.py
# Select: 3 (Commodity)
# Enter: oil
```

**Output:**
```
🚀 Unified Price Analyzer
================================================================================
Analyze prices from multiple sources:
  • Retail: Amazon, Walmart, eBay
  • Wholesale: Alibaba
  • Commodities: Alpha Vantage, FRED, EIA
================================================================================

Select analysis type:
  1. Retail (Amazon, Walmart, eBay)
  2. Wholesale (Alibaba)
  3. Commodity (Alpha Vantage, FRED, EIA)

Enter choice (1/2/3): 3

Enter commodity name (e.g., COPPER, WHEAT, OIL): oil

⚡ Analyzing COMMODITY prices for: oil
================================================================================
📊 Checking FRED...
📊 Checking EIA...

================================================================================
📊 MARKET ANALYSIS - COMMODITY
================================================================================

💰 PRICE SUMMARY:
--------------------------------------------------------------------------------
  Sources Analyzed:    2
  Total Listings:     2
  Price Range:        $59.04 - $59.04
  Median Price:       $59.04
  Average Price:      $59.04
  Minimum Price:      $59.04
  Maximum Price:      $59.04

📋 DETAILED BREAKDOWN BY SOURCE:
--------------------------------------------------------------------------------

  📊 FRED:
    ----------------------------------------------------------------------------
    Commodity Name:   Crude Oil (WTI)
    Category:         Energy
    Series ID:        DCOILWTICO
    Current Price:    $59.04 Dollars per Barrel
    Previous Price:   $60.23 Dollars per Barrel
    Price Change:     $1.19 (-1.98%)
    Date:             2025-12-08

    💡 Price Breakdown:
       • $59.04 per barrel
       • 1 barrel = 42 US gallons
       • $1.41 per gallon
       • $432.76 per cubic meter

  📊 EIA:
    ----------------------------------------------------------------------------
    Commodity Name:   Crude Oil (WTI)
    Category:         Oil
    Series ID:        PET.RWTC.D
    Current Price:    $59.04 USD per barrel
    Previous Price:   $60.23 USD per barrel
    Price Change:     $1.19 (-1.98%)
    Date:             2025-12-08

    💡 Price Breakdown:
       • $59.04 per barrel
       • 1 barrel = 42 US gallons
       • $1.41 per gallon
       • $432.76 per cubic meter

================================================================================
💡 MARKET PRICE ESTIMATE:
--------------------------------------------------------------------------------
⚡ Current Commodity Price: $59.04 Dollars per Barrel
📊 Price Range: $59.04 - $59.04

💡 Price Details:
   • $59.04 per barrel (42 US gallons)
   • Equivalent to ~$1.41 per gallon

📈 Price Movement:
   • Change: $1.19 (-1.98%)
   • As of: 2025-12-08
================================================================================
```

---

## Example 2: Commodity Analysis - Wheat

```bash
$ python3 unified_price_analyzer.py
# Select: 3 (Commodity)
# Enter: wheat
```

**Output:**
```
🚀 Unified Price Analyzer
================================================================================
Analyze prices from multiple sources:
  • Retail: Amazon, Walmart, eBay
  • Wholesale: Alibaba
  • Commodities: Alpha Vantage, FRED, EIA
================================================================================

Select analysis type:
  1. Retail (Amazon, Walmart, eBay)
  2. Wholesale (Alibaba)
  3. Commodity (Alpha Vantage, FRED, EIA)

Enter choice (1/2/3): 3

Enter commodity name (e.g., COPPER, WHEAT, OIL): wheat

⚡ Analyzing COMMODITY prices for: wheat
================================================================================
📊 Checking FRED...
📊 Checking EIA...

================================================================================
📊 MARKET ANALYSIS - COMMODITY
================================================================================

💰 PRICE SUMMARY:
--------------------------------------------------------------------------------
  Sources Analyzed:    1
  Total Listings:     1
  Price Range:        $173.19 - $173.19
  Median Price:       $173.19
  Average Price:      $173.19
  Minimum Price:      $173.19
  Maximum Price:      $173.19

📋 DETAILED BREAKDOWN BY SOURCE:
--------------------------------------------------------------------------------

  📊 FRED:
    ----------------------------------------------------------------------------
    Commodity Name:   Wheat
    Category:         Agricultural
    Series ID:        PWHEAMTUSDM
    Current Price:    $173.19 U.S. Dollars per Metric Ton
    Previous Price:   $196.84 U.S. Dollars per Metric Ton
    Price Change:     $23.65 (-12.01%)
    Date:             2025-06-01

    💡 Price Breakdown:
       • $173.19 per metric ton (1,000 kg)
       • $0.1732 per kg
       • $0.0786 per pound

================================================================================
💡 MARKET PRICE ESTIMATE:
--------------------------------------------------------------------------------
⚡ Current Commodity Price: $173.19 U.S. Dollars per Metric Ton
📊 Price Range: $173.19 - $173.19

💡 Price Details:
   • $173.19 per metric ton (1,000 kg)
   • Equivalent to ~$0.1732 per kg

📈 Price Movement:
   • Change: $23.65 (-12.01%)
   • As of: 2025-06-01
================================================================================
```

---

## Example 3: Retail Analysis - Sony XM5 Headphones

```bash
$ python3 unified_price_analyzer.py
# Select: 1 (Retail)
# Enter: sony xm5
```

**Output:**
```
🚀 Unified Price Analyzer
================================================================================
Analyze prices from multiple sources:
  • Retail: Amazon, Walmart, eBay
  • Wholesale: Alibaba
  • Commodities: Alpha Vantage, FRED, EIA
================================================================================

Select analysis type:
  1. Retail (Amazon, Walmart, eBay)
  2. Wholesale (Alibaba)
  3. Commodity (Alpha Vantage, FRED, EIA)

Enter choice (1/2/3): 1

Enter product name: sony xm5

🛒 Analyzing RETAIL prices for: sony xm5
================================================================================

📦 Checking Amazon...
🔍 Searching Amazon for: sony xm5
📡 URL: https://www.amazon.com/s?k=sony%20xm5

📦 Checking Walmart...
🔍 Searching Walmart for: sony xm5
📡 Trying search URL...

⏳ Establishing connection to Walmart...
Successfully fetched page, parsing results...
📦 Checking eBay...
🔍 Searching eBay for: sony xm5
📡 Trying search URL...

⏳ Establishing connection to eBay...
Successfully fetched page, parsing results...

================================================================================
📊 MARKET ANALYSIS - RETAIL
================================================================================

💰 PRICE SUMMARY:
--------------------------------------------------------------------------------
  Sources Analyzed:    3
  Total Listings:     28
  Price Range:        $125.99 - $398.00
  Median Price:       $174.50
  Average Price:      $198.83
  Minimum Price:      $125.99
  Maximum Price:      $398.00

📋 DETAILED BREAKDOWN BY SOURCE:
--------------------------------------------------------------------------------

  📊 Amazon:
    ----------------------------------------------------------------------------
    Listings Found:   9
    Price Range:      $149.99 - $398.00
    Median Price:     $248.00
    Average Price:    $255.66

  📊 Walmart:
    ----------------------------------------------------------------------------
    Listings Found:   1
    Price Range:      $248.00 - $248.00
    Median Price:     $248.00
    Average Price:    $248.00

  📊 eBay:
    ----------------------------------------------------------------------------
    Listings Found:   18
    Price Range:      $125.99 - $248.00
    Median Price:     $156.08
    Average Price:    $167.68

================================================================================
💡 MARKET PRICE ESTIMATE:
--------------------------------------------------------------------------------
🛒 Retail Market Price: $174.50 per unit
📊 Price Range: $125.99 - $398.00

💡 Interpretation:
   • Typical retail price: $174.50
   • Lowest found: $125.99
   • Highest found: $398.00
================================================================================
```

---

## Example 4: Wholesale Analysis - Wireless Headphones

```bash
$ python3 alibaba_price_parser.py wireless headphones
```

**Output:**
```
🚀 Starting Alibaba Wholesale Price Parser...

🔍 Searching Alibaba for: wireless headphones
📡 Trying search URL...

⏳ Establishing connection to Alibaba...
Successfully fetched page, parsing results...
Found 3 unique listings
📋 Price range: $5.990 - $13.000 per unit


======================================================================
📊 WHOLESALE PRICE ANALYSIS FOR: WIRELESS HEADPHONES
======================================================================

📦 Products Analyzed: 3

💰 PRICE STATISTICS:
----------------------------------------------------------------------
  Lowest Price (per unit): $5.990
    👤 Supplier:          Unknown Supplier
    📦 MOQ:              10 units
    💵 Price Range:      $5.99
    📏 Unit:             5
    📦 Product:          Coco VIPWirelessHeadphones
    🔗 Link:             https://www.alibaba.com/product-detail/Coco-VIP-Wireless-Headphones_1601415334784.html

  Highest Price (per unit): $13.000
    👤 Supplier:          Unknown Supplier
    📦 MOQ:              100 units
    💵 Price Range:      $13-15
    📏 Unit:             5
    📦 Product:          Smart Car Office Airplane Travel Memory Foam Noise...
    🔗 Link:             https://www.alibaba.com/product-detail/Smart-Car-Office-Airplane-Travel-Memory_1601004096962.html

  Mean (Average):         $10.663
  Median:                 $13.000
    👤 Median Supplier:   Unknown Supplier
    📦 MOQ:              100 units
    🔗 Link:             https://www.alibaba.com/product-detail/Smart-Car-Office-Airplane-Travel-Memory_1601004096962.html
  Mode:                   $13.000
    👤 Mode Supplier:     Unknown Supplier
    🔗 Link:             https://www.alibaba.com/product-detail/Smart-Car-Office-Airplane-Travel-Memory_1601004096962.html
  Standard Deviation:     $3.305

📦 MOQ (Minimum Order Quantity) STATISTICS:
----------------------------------------------------------------------
  Average MOQ:             37 units
  Minimum MOQ:            1 units
  Maximum MOQ:            100 units

📈 PRICE PERCENTILES:
----------------------------------------------------------------------
  5th Percentile:         $6.691
  10th Percentile:        $7.392
  25th Percentile:        $9.495
  75th Percentile:        $13.000
  90th Percentile:        $13.000
  95th Percentile:        $13.000

📋 ALL PRODUCTS FOUND (sorted by price):
----------------------------------------------------------------------

  1. $5.99 per unit - Coco VIPWirelessHeadphones
     👤 Supplier: Unknown Supplier
     📦 MOQ: 10 units
     📏 Unit: 5
     🔗 https://www.alibaba.com/product-detail/Coco-VIP-Wireless-Headphones_1601415334784.html

  2. $13-15 per unit - Smart Car Office Airplane Travel Memory ...
     👤 Supplier: Unknown Supplier
     📦 MOQ: 100 units
     📏 Unit: 5
     🔗 https://www.alibaba.com/product-detail/Smart-Car-Office-Airplane-Travel-Memory_1601004096962.html

  3. $13.00 - $15.00 per unit - Product
     👤 Supplier: Unknown Supplier
     📦 MOQ: 1 units

======================================================================
Analysis Complete!
======================================================================
```

---

## Example 5: Individual Parser - EIA Oil Price

```bash
$ python3 eia_price_parser.py OIL
```

**Output:**
```
🚀 EIA (Energy Information Administration) Parser
================================================================================

[1/1] Fetching OIL...

================================================================================
⚡ EIA ENERGY PRICES
================================================================================

📁 OIL
--------------------------------------------------------------------------------

📉 Crude Oil (WTI) (PET.RWTC.D)
  Current Price:     59.04 USD per barrel
  Previous Price:    60.23 USD per barrel
  Change:            -1.19 (-1.98%)
  Date:              2025-12-08

================================================================================
```

---

## Example 6: Individual Parser - FRED Copper Price

```bash
$ python3 fred_price_parser.py COPPER
```

**Output:**
```
🚀 FRED (Federal Reserve Economic Data) Parser
================================================================================

[1/1] Fetching COPPER...

================================================================================
📊 FRED ECONOMIC DATA
================================================================================

📁 METALS
--------------------------------------------------------------------------------

📈 Copper (PCOPPUSDM)
  Current Value:     9,835.07 U.S. Dollars per Metric Ton
  Previous Value:    9,531.20 U.S. Dollars per Metric Ton
  Change:            +303.87 (+3.19%)
  Date:              2025-06-01

================================================================================
```

---

## Key Features Demonstrated

### Retail Analysis
- Aggregates prices from Amazon, Walmart, eBay
- Calculates median, average, min, max prices
- Shows price range across retailers
- Provides market price estimate

### Wholesale Analysis
- Extracts prices from Alibaba
- Shows MOQ (Minimum Order Quantity) ranges
- Calculates price statistics with MOQ context
- Provides supplier information and product links

### Commodity Analysis
- Aggregates data from multiple APIs (FRED, EIA, Alpha Vantage)
- Shows unit conversions (barrel to gallon, ton to pound, etc.)
- Displays price movements and trends
- Provides detailed breakdowns with category information

### Unified System
- Single interface for all analysis types
- Parallel data collection from multiple sources
- Comprehensive market intelligence in seconds
- Actionable insights for procurement decisions

