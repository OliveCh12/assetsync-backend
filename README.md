# 📋 **AssetSync - Concept Specification Document**
## Resale Value Tracking and Management Application

---

## 🎯 **Core Concept Definition**

AssetSync is a mobile application that enables users to **track all their owned assets** and **estimate their future resale value** in real-time. Users register their purchases with the original price and date, then the application continuously calculates the estimated resale value according to different temporal scenarios.

**Concrete example**: I buy a car for €25,000 today. I plan to sell it in 4 years. The application continuously provides me with three estimates of its value in 4 years: pessimistic (€8,000), realistic (€12,000), optimistic (€16,000), and updates these forecasts based on market evolution.

The concept is built on the fundamental distinction between **personal use** (optimizing private resales) and **professional use** (managing business assets with accounting constraints), while covering **all categories of resellable goods**: vehicles, electronics, appliances, clothing, furniture, sports equipment, luxury items, etc.

---

## 🏗️ **Dual-Context Architecture**

### **Personal Context: Resale Optimization**

Users register their personal belongings to optimize their resale decisions. The application calculates projected depreciation and identifies optimal selling moments based on user objectives.

**Functional logic**:
- Registration: Item + Purchase price + Purchase date + Planned resale timeframe
- Continuous calculation: Current value + Projected value at target date + Forecast evolution
- Recommendations: Alerts when optimal selling moment approaches or when value drops abnormally

### **Professional Context: Depreciable Asset Management**

Companies register their asset acquisitions to track their book value and market value simultaneously. This enables optimization of renewal decisions by cross-referencing accounting depreciation with actual resale value.

**Functional logic**:
- Registration: Asset + Purchase price + Date + Accounting depreciation period + Assignment
- Dual calculation: Net book value (regulatory depreciation) + Estimated market value
- Decision support: Identify when market value exceeds remaining book value

---

## 📦 **Universal Asset Coverage**

### **All Resellable Asset Categories**

The application handles **every category of goods that can be resold**:

**Vehicles**: Cars, motorcycles, boats, RVs, bicycles, electric scooters
**Electronics**: Smartphones, laptops, tablets, gaming consoles, cameras, audio equipment
**Home Appliances**: Refrigerators, washing machines, ovens, vacuum cleaners, small appliances
**Clothing & Fashion**: Designer clothing, shoes, bags, jewelry, watches, accessories
**Furniture**: Sofas, tables, chairs, beds, storage furniture, decorative items
**Sports & Leisure**: Gym equipment, bikes, ski gear, golf clubs, musical instruments
**Tools & Equipment**: Power tools, garden equipment, professional machinery
**Collectibles**: Art, vintage items, books, vinyl records, trading cards

### **Market Value Foundation**

The entire application is built around **real market value** of owned objects. Every feature, calculation, and recommendation is based on actual market data rather than theoretical depreciation curves.

**Core principle**: The true value of an object is what someone is willing to pay for it today on the resale market, not its original price minus arbitrary depreciation.

---

## 🔢 **Multi-Scenario Valuation System**

### **Three-Tier Estimation Approach**

For each object, the application generates three value estimates at the planned selling date:

**Pessimistic Estimate**: Based on worst market conditions historically observed for this category. Corresponds to urgent sale or saturated market conditions.

**Realistic Estimate**: Based on average depreciation trends observed over the last 3 years. Corresponds to normal market sale conditions.

**Optimistic Estimate**: Based on best market conditions, accounting for factors like increasing rarity or collector demand. Corresponds to patient sale with optimal buyer search.

### **Real-Time Market Data Sources**

**Live marketplace data**: Prices observed on Leboncoin, Vinted, eBay, Facebook Marketplace, specialized platforms by category
**Historical depreciation analysis**: Multi-year depreciation curve analysis by object category to identify recurring patterns
**Market impact events**: New model releases, production discontinuations, technological evolution that accelerate or slow depreciation
**Seasonal trends**: Analysis of seasonal demand patterns for different categories (winter sports equipment, summer clothing, etc.)

---

## 📱 **Core Functionalities**

### **Simplified Asset Registration**

**Photo-based input**: User photographs the object and purchase receipt. Application automatically recognizes the product and extracts purchase price from the invoice.

**Universal product database**: Automatic recognition of exact references across all categories to ensure estimation accuracy (model, year, specifications).

**Manual input alternative**: For unrecognized objects, guided input with suggestions based on text search and category selection.

### **Real-Time Value Tracking**

**Per-object dashboard**: Value evolution curve since purchase with future projection according to three scenarios.

**Automatic alerts**: Notifications when value reaches user-defined threshold or when optimal selling moment approaches.

**Goal vs reality comparison**: Gap between initially expected value and current estimate for planned selling date.

### **Integrated Selling Support**

**Platform connections**: Direct integration with major resale platforms for automated listing:
- **Leboncoin**: Automatic listing generation with optimized descriptions and pricing
- **Vinted**: Clothing and fashion items with size and condition mapping
- **eBay**: Electronics and collectibles with auction or fixed price options
- **Facebook Marketplace**: Local sales with geographic targeting
- **Specialized platforms**: Category-specific platforms (automotive, luxury goods, etc.)

**Optimal timing calendar**: Suggestions for best selling periods based on category seasonality.

**Impact of new releases**: Automatic alerts when announcement of new models risks accelerating depreciation.

**Multi-platform listing management**: Ability to list the same item on multiple platforms with synchronized inventory.

---

## 🏢 **Professional Context Specificities**

### **Integrated Accounting Management**

**Dual vision**: Each asset displays both its net book value (according to regulatory depreciation) and estimated market value simultaneously.

**Renewal optimization**: Identification of assets whose market value exceeds residual book value, suggesting early disposal opportunity.

**Accounting export**: Automatic generation of disposal entries with calculated capital gains/losses.

### **Multi-User Management**

**Asset assignment**: Each asset can be assigned to an employee, department, or site with movement history tracking.

**Roles and permissions**: Administrator (all actions), Manager (add/modify), Viewer (read-only), Accountant (export and calculations).

**Validation workflows**: Configurable approval process for acquisitions and disposals based on amounts.

---

## 🔗 **Platform Integrations and Marketplace Connections**

### **Resale Platform Ecosystem**

**Native integrations** with major platforms:
- **Leboncoin**: Automated listing with category-specific optimization
- **Vinted**: Fashion items with automatic size, brand, and condition mapping
- **eBay**: Global reach for electronics and collectibles
- **Facebook Marketplace**: Local community sales
- **Vestiaire Collective**: Luxury fashion and designer items
- **Chrono24**: Luxury watches
- **Catawiki**: Art and collectibles auctions
- **BackMarket**: Refurbished electronics

**Cross-platform management**: Single interface to manage listings across multiple platforms with:
- Synchronized inventory (sold on one platform removes from others)
- Platform-specific pricing strategies
- Unified message management from buyers
- Performance analytics per platform

### **Market Data Integration**

**Automated data collection**: Daily scraping of sale prices on major platforms to maintain up-to-date database.

**Partner APIs**: Integration with professional valuation services for specific categories (automotive, professional equipment).

**User contribution**: Users can report their actual sales to improve algorithm accuracy.

**Real-time price tracking**: Continuous monitoring of similar items to adjust valuations dynamically.

---

## 🎯 **Concrete Use Cases**

### **Personal Use - Lifestyle Optimization**

**Scenario**: John buys a BMW 3 Series for €35,000. He plans to keep it for 5 years before selling. The application shows he can probably sell it for between €12,000 (pessimistic) and €18,000 (optimistic) in 5 years. 6 months before the deadline, the application alerts him that a new generation BMW is being announced and he should sell now at €20,000 rather than wait.

**Fashion scenario**: Sarah buys a Chanel bag for €3,000. She wants to sell it in 2 years. The app tracks similar bag sales on Vestiaire Collective and Vinted, showing current resale value at €2,100 with projection to €1,800 in 2 years (realistic scenario).

### **Professional Use - Fleet Optimization**

**Scenario**: A startup bought 50 laptops at €1,500 each 18 months ago. Accounting depreciation is planned over 3 years (current net book value: €750). The application estimates current market value at €900 per machine. The company can consider selling them now and buying more recent equipment, realizing an accounting gain while renewing their fleet.

---

## 💰 **Economic Model**

### **Personal Freemium**

**Free tier**: Up to 50 tracked objects with basic estimations and manual platform listing
**Premium (€6.99/month)**: Unlimited objects + multi-scenario estimations + automated platform listings + advanced alerts + selling optimization recommendations

### **Professional Per-User Pricing**

**Starter (€25/month)**: Up to 200 assets + 5 users + basic exports + platform integrations
**Business (€75/month)**: Up to 1000 assets + 20 users + accounting integrations + advanced reporting
**Enterprise (custom pricing)**: Unlimited assets + unlimited users + API access + dedicated support

### **Transaction-Based Revenue**

**Platform commissions**: 1-2% of transaction value for sales facilitated through integrated platforms
**Premium listings**: Enhanced visibility options on partner platforms for additional fees
**Valuation services**: Professional appraisal services for high-value items

---

## 🚀 **Development Roadmap**

### **Phase 1 - Personal MVP (6 months)**

**Objective**: Validate core concept with private users across multiple categories

**Core features**:
- Manual object registration (name, price, date, planned retention period)
- Tri-scenario value estimations for 10 pilot categories: smartphones, laptops, cars, appliances, designer bags, watches, bikes, gaming consoles, furniture, sports equipment
- Basic marketplace data collection for valuation
- Simple dashboard with evolution curve per object
- Manual listing creation for Leboncoin and Vinted

**Expected validation**: Do users find estimations reliable enough to guide their decisions across different asset categories?

### **Phase 2 - Automation and Marketplace Integration (12 months)**

**Objective**: Industrialize data collection and automate platform connections

**New features**:
- Automatic object recognition by photo across all categories
- Automated scraping of 5 major resale platforms
- Direct integration with Leboncoin, Vinted, eBay for automated listing
- Automatic alert system (thresholds, optimal moments)
- Cross-platform inventory synchronization

**Expected validation**: Does automation significantly improve user experience and selling success rate?

### **Phase 3 - Professional Context (18 months)**

**Objective**: Introduce basic professional functionalities

**New features**:
- Multiple account system (personal + professional)
- Accounting depreciation calculations parallel to market estimations
- Multi-user management with 3 basic roles
- CSV export for accounting integration
- Asset assignment and tracking

**Expected validation**: Do companies see added value in cross-referencing accounting depreciation with market value?

### **Phase 4 - Intelligence and Advanced Integrations (24 months)**

**Objective**: Refine predictions and facilitate integrations

**New features**:
- Predictive algorithms based on user history and market trends
- Native connectors with major accounting software
- Public API for custom integrations
- Personalized recommendation system
- Advanced analytics and reporting tools

**Expected validation**: Are predictions accurate enough to justify important financial decisions?

### **Phase 5 - Platform and Ecosystem (30 months)**

**Objective**: Transform application into comprehensive service platform

**New features**:
- Integrated marketplace for direct sales between users
- Partnerships with insurers and financing services
- Comparative analysis tools for professionals
- AI-powered market insights and trend analysis
- White-label solutions for retailers and manufacturers

This progression ensures continuous concept validation while progressively building the complexity needed for advanced professional use cases across all resellable asset categories.

---

## 🚀 **Current API Implementation Status**

The AssetSync backend is actively under development with the following features completed:

### ✅ **Phase 1: Security & Authentication Foundation (COMPLETED)**
- **Database Schema**: Complete 19-table PostgreSQL schema with relationships
- **Input Validation**: 57 Zod schemas with drizzle-zod integration  
- **JWT Authentication**: Token-based auth with access/refresh pattern
- **User Management**: Registration, login, logout, password reset, profile management
- **Role-Based Access**: Personal vs professional user contexts
- **Session Management**: Database-backed session tracking for enhanced security

### ✅ **Phase 2: Core Asset Management (COMPLETED)**
- **Asset CRUD Operations**: Complete create, read, update, delete functionality
- **Enhanced Asset Search**: Advanced filtering by category, status, condition, price range, dates
- **Asset Categories**: Hierarchical category system with 7 main categories and subcategories
- **Asset Statistics**: User dashboard with asset counts, total value, condition breakdown
- **Image Management**: Asset image upload and management system
- **Rich Asset Data**: Support for specifications, tags, notes, serial numbers, locations

### 🔧 **Available API Endpoints**

#### Authentication (`/api/v1/auth/`)
- `POST /register` - User registration with email verification
- `POST /login` - User authentication with JWT tokens  
- `POST /logout` - Session termination
- `POST /refresh-token` - Token renewal
- `POST /password-reset-request` - Request password reset
- `POST /password-reset` - Reset password with token
- `GET /me` - Get current user profile

#### Assets (`/api/v1/assets/`)
- `GET /assets` - List assets with advanced filtering and pagination
- `GET /assets/:id` - Get detailed asset information
- `POST /assets` - Create new asset with full metadata
- `PUT /assets/:id` - Update asset details
- `DELETE /assets/:id` - Soft delete asset
- `POST /assets/:id/images` - Upload asset images
- `GET /assets/stats` - Get user asset statistics

#### Categories (`/api/v1/categories/`)
- `GET /categories` - List all categories with hierarchy support
- `GET /categories/:id` - Get specific category details
- `POST /categories` - Create new category (admin)
- `PUT /categories/:id` - Update category (admin)
- `DELETE /categories/:id` - Soft delete category (admin)

### 🛠 **Technical Stack**
- **Framework**: Hono (Fast edge-compatible web framework)
- **Database**: PostgreSQL 17.5 with Drizzle ORM
- **Validation**: Zod schemas with type safety
- **Authentication**: JWT with bcrypt password hashing
- **Development**: TypeScript, tsx hot reload, pnpm package management

### 📊 **Database Features**
- **19 Comprehensive Tables**: Users, assets, categories, valuations, platforms, transactions
- **Hierarchical Categories**: Support for main categories and unlimited subcategories
- **Multi-Scenario Valuation**: Ready for pessimistic/realistic/optimistic value tracking
- **Professional Context**: Organization management, user roles, asset assignment
- **Audit Trails**: Comprehensive change tracking and soft deletes
- **Platform Integration**: Ready for marketplace connections (Leboncoin, Vinted, eBay)

### 🧪 **Testing & Development**
- **Development Server**: `pnpm dev` (http://localhost:3001)
- **Database Seeding**: `pnpm db:seed` with realistic test data
- **API Testing**: Simple test script with authentication flow
- **Database Studio**: `pnpm db:studio` for visual database management

### 📋 **Coming Next (Phases 3-6)**
- **Asset Valuation System**: Multi-scenario estimation engine
- **Platform Integration**: OAuth connections to marketplaces
- **Real-time Features**: WebSocket updates, live notifications
- **Business Features**: Organizations, billing, subscription management
- **Production Ready**: Testing, monitoring, deployment configuration

The backend successfully implements the core AssetSync concept with a solid foundation for both personal and professional asset management contexts.