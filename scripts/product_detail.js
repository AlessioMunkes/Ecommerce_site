/* ==========================================================
   ROOTS — product_detail.js
   Exposes the PRODUCTS catalogue as a global so the React
   component in product_detail.html can look up products by id.
   ========================================================== */

var PRODUCTS = {

    /* ─────────────────────────────────────────
       PRODUCE
    ───────────────────────────────────────── */

    1: {
        id:        '1',
        name:      'Spinach (1kg)',
        category:  'Vegetables',
        price:     45,
        priceUnit: 'per kg',
        stock:     'In Stock',
        image:     'media/spinach-products.jpg',
        badge:     'Vegetables',
        chips: [
            { label: 'Weight',  value: '1 kg' },
            { label: 'Variety', value: 'Baby & Flat-leaf' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Khayelitsha, CT' },
        ],
        farmer: {
            name:       'Khayelitsha Greens',
            location:   'Khayelitsha, Cape Town',
            note:       'A community of 18 small-plot farmers pooling their harvests since 2021 — known for their chemical-free growing practices and consistent year-round supply.',
        },
        description: 'Fresh, tender spinach harvested by hand from community plots in Khayelitsha. Our spinach is a mix of baby and flat-leaf varieties, grown without pesticides or synthetic fertilisers on well-composted township soil. Best used in stir-fries, curries, smoothies, or lightly wilted with garlic and olive oil. Storage: keep unwashed in a sealed bag in the fridge. Best consumed within 4–5 days.',
        nutrition: [
            { label: 'Energy',           value: '23 kcal / 100g' },
            { label: 'Protein',          value: '2.9g' },
            { label: 'Carbohydrates',    value: '3.6g' },
            { label: 'of which sugars',  value: '0.4g' },
            { label: 'Fat',              value: '0.4g' },
            { label: 'Fibre',            value: '2.2g' },
            { label: 'Iron',             value: '2.7mg' },
            { label: 'Vitamin C',        value: '28mg' },
        ],
        reviews: [
            { author: 'Nomsa T.',  rating: 5, date: 'March 2026',    body: 'Absolutely fresh — still had dew on the leaves when it arrived. Best spinach I have bought in years.' },
            { author: 'Pieter V.', rating: 4, date: 'February 2026', body: 'Great quality and price. I use it in everything. Would be 5 stars if the leaves were a little more uniform in size.' },
        ],
    },

    2: {
        id:        '2',
        name:      'Tomatoes (1kg)',
        category:  'Vegetables',
        price:     30,
        priceUnit: 'per kg',
        stock:     'In Stock',
        image:     'media/tomatoes-products.jpg',
        badge:     'Vegetables',
        chips: [
            { label: 'Weight',  value: '1 kg' },
            { label: 'Variety', value: 'Roma & Round' },
            { label: 'Method',  value: 'Open-air grown' },
            { label: 'Origin',  value: 'Mitchells Plain, CT' },
        ],
        farmer: {
            name:       'Mitchells Plain Growers',
            location:   'Mitchells Plain, Cape Town',
            note:       'A family-led farm of 11 plots specialising in tomatoes and peppers, using rainwater harvesting and natural compost to keep their produce clean and affordable.',
        },
        description: 'Sun-ripened Roma and round tomatoes grown on open plots in Mitchells Plain. Picked at peak ripeness and delivered within 24 hours — full flavour guaranteed. Perfect for sauces, salads, braises, and braai side dishes. Storage: room temperature until fully ripe, then refrigerate and use within 3 days.',
        nutrition: [
            { label: 'Energy',           value: '18 kcal / 100g' },
            { label: 'Protein',          value: '0.9g' },
            { label: 'Carbohydrates',    value: '3.9g' },
            { label: 'of which sugars',  value: '2.6g' },
            { label: 'Fat',              value: '0.2g' },
            { label: 'Fibre',            value: '1.2g' },
            { label: 'Vitamin C',        value: '14mg' },
            { label: 'Lycopene',         value: '2573mcg' },
        ],
        reviews: [
            { author: 'Ayanda M.', rating: 5, date: 'April 2026', body: 'These taste like the tomatoes I grew up eating from the garden. Sweet, firm, and full of flavour.' },
            { author: 'Riana S.',  rating: 5, date: 'March 2026', body: 'Made a tomato bredie with these and my whole family asked what I did differently. Nothing — just better tomatoes.' },
        ],
    },

    3: {
        id:        '3',
        name:      'Lemons (1kg)',
        category:  'Fruits',
        price:     60,
        priceUnit: 'per kg',
        stock:     'In Stock',
        image:     'media/lemons-products.jpeg',
        badge:     'Fruits',
        chips: [
            { label: 'Weight',  value: '1 kg (±6–8 lemons)' },
            { label: 'Variety', value: 'Eureka' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Gugulethu, CT' },
        ],
        farmer: {
            name:       'Gugulethu Citrus Growers',
            location:   'Gugulethu, Cape Town',
            note:       'This farm has been growing Eureka lemons since 2019, using grey water irrigation and organic compost to produce juicy, thick-skinned lemons year-round.',
        },
        description: 'Bright, juicy Eureka lemons grown on community plots in Gugulethu. Each kilogram contains approximately 6–8 full-sized lemons with thick, fragrant skins and minimal seeds — ideal for both juice and zest. Use in cooking, baking, drinks, and home remedies. Storage: room temperature for 1 week, or refrigerated in a sealed bag for up to 3 weeks.',
        nutrition: [
            { label: 'Energy',           value: '29 kcal / 100g' },
            { label: 'Protein',          value: '1.1g' },
            { label: 'Carbohydrates',    value: '9.3g' },
            { label: 'of which sugars',  value: '2.5g' },
            { label: 'Fat',              value: '0.3g' },
            { label: 'Fibre',            value: '2.8g' },
            { label: 'Vitamin C',        value: '53mg' },
            { label: 'Potassium',        value: '138mg' },
        ],
        reviews: [
            { author: 'Fatima A.', rating: 5, date: 'April 2026', body: 'Incredible lemons — so much juice in each one. I made lemon curd and it was the best I have ever tasted.' },
            { author: 'Johan B.',  rating: 4, date: 'March 2026', body: 'Good size and very juicy. A bit pricier than the shop but the quality makes it worth it.' },
        ],
    },

    4: {
        id:        '4',
        name:      'Butternut Squash',
        category:  'Vegetables',
        price:     70,
        priceUnit: 'per unit',
        stock:     'In Stock',
        image:     'media/butternut-products.jpeg',
        badge:     'Vegetables',
        chips: [
            { label: 'Weight',  value: '±900g – 1.3kg' },
            { label: 'Pack',    value: '1 whole butternut' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Langa, CT' },
        ],
        farmer: {
            name:       'Langa Community Gardens',
            location:   'Langa, Cape Town',
            note:       'One of the oldest community garden networks in Cape Town, the Langa garden has been growing squash and pumpkins for over a decade using traditional composting methods.',
        },
        description: 'Sweet, dense butternuts grown on community plots in Langa. Each one is harvested by hand once fully mature, resulting in a deep orange flesh with a naturally sweet, nutty flavour. Exceptional roasted whole, cubed in soups and stews, or mashed as a side. An excellent source of Vitamin A and fibre.',
        nutrition: [
            { label: 'Energy',           value: '45 kcal / 100g' },
            { label: 'Protein',          value: '1.0g' },
            { label: 'Carbohydrates',    value: '11.7g' },
            { label: 'of which sugars',  value: '2.2g' },
            { label: 'Fat',              value: '0.1g' },
            { label: 'Fibre',            value: '2.0g' },
            { label: 'Vitamin A',        value: '532mcg' },
            { label: 'Potassium',        value: '352mg' },
        ],
        reviews: [
            { author: 'Lindiwe N.', rating: 5, date: 'April 2026', body: 'The sweetest butternut I have had. Roasted it with honey and it was incredible. Big size too, great value.' },
            { author: 'Marco P.',   rating: 5, date: 'March 2026', body: 'Made butternut soup — rich, thick, and naturally sweet. Will not be buying from the supermarket again.' },
        ],
    },

    5: {
        id:        '5',
        name:      'Maize Meal (2kg)',
        category:  'Dry Goods',
        price:     55,
        priceUnit: 'per bag',
        stock:     'In Stock',
        image:     'media/maize-meal-products.jpeg',
        badge:     'Dry Goods',
        chips: [
            { label: 'Weight',  value: '2 kg' },
            { label: 'Type',    value: 'Super-maize' },
            { label: 'Method',  value: 'Stone-ground' },
            { label: 'Origin',  value: 'Paarl, WC' },
        ],
        farmer: {
            name:       'Paarl Valley Grain Co.',
            location:   'Paarl, Western Cape',
            note:       'A small grain producer in the Paarl Valley using heritage maize varieties and stone-grinding techniques to produce a full-flavour meal with a natural coarse texture.',
        },
        description: 'Stone-ground super-maize meal from heritage varieties grown in the Paarl Valley. Coarser and more flavourful than commercially processed alternatives, this meal makes exceptional pap, uphuthu, and porridge with a natural corn sweetness. No additives or preservatives.',
        nutrition: [
            { label: 'Energy',        value: '362 kcal / 100g' },
            { label: 'Protein',       value: '8.1g' },
            { label: 'Carbohydrates', value: '76g' },
            { label: 'Fat',           value: '1.9g' },
            { label: 'Fibre',         value: '2.4g' },
            { label: 'Iron',          value: '2.4mg' },
        ],
        reviews: [
            { author: 'Thandi K.',  rating: 5, date: 'March 2026', body: 'This pap tastes like my grandmother used to make. You can taste the difference immediately.' },
            { author: 'Sipho M.',   rating: 4, date: 'February 2026', body: 'Great texture and flavour. Cooks a little slower than fine-ground but totally worth it.' },
        ],
    },

    6: {
        id:        '6',
        name:      'Sorghum (1kg)',
        category:  'Dry Goods',
        price:     65,
        priceUnit: 'per bag',
        stock:     'In Stock',
        image:     'media/sorghum-products.jpg',
        badge:     'Dry Goods',
        chips: [
            { label: 'Weight',  value: '1 kg' },
            { label: 'Type',    value: 'Red sorghum' },
            { label: 'Method',  value: 'Traditionally processed' },
            { label: 'Origin',  value: 'Stellenbosch, WC' },
        ],
        farmer: {
            name:       'Stellenbosch Heritage Grains',
            location:   'Stellenbosch, Western Cape',
            note:       'Specialising in heritage grain varieties, this small farm grows red sorghum using traditional dry-farming methods with no irrigation and no synthetic inputs.',
        },
        description: 'Traditionally processed red sorghum from heritage varieties grown in Stellenbosch. Used to make umqombothi, porridge, and flatbreads. Gluten-free and high in antioxidants. A staple grain with deep roots in South African food culture.',
        nutrition: [
            { label: 'Energy',        value: '329 kcal / 100g' },
            { label: 'Protein',       value: '11g' },
            { label: 'Carbohydrates', value: '72g' },
            { label: 'Fat',           value: '3.5g' },
            { label: 'Fibre',         value: '6.3g' },
            { label: 'Iron',          value: '4.4mg' },
        ],
        reviews: [
            { author: 'Bongani Z.', rating: 5, date: 'April 2026', body: 'Excellent quality sorghum. Made traditional porridge and the flavour is authentic and rich.' },
            { author: 'Claire T.', rating: 4, date: 'March 2026', body: 'Hard to find good sorghum — this one is genuinely good. Nutty, wholesome, and great value.' },
        ],
    },

    7: {
        id:        '7',
        name:      'Green Seeds Pack',
        category:  'Seeds',
        price:     85,
        priceUnit: 'per pack',
        stock:     'In Stock',
        image:     'media/greens-seedpack-products.jpeg',
        badge:     'Seeds',
        chips: [
            { label: 'Contents', value: '5 variety mix' },
            { label: 'Type',     value: 'Open-pollinated' },
            { label: 'Method',   value: 'Untreated' },
            { label: 'Origin',   value: 'Cape Town, WC' },
        ],
        farmer: {
            name:       'Roots Seed Library',
            location:   'Cape Town, Western Cape',
            note:       'Our community seed library sources, saves, and distributes open-pollinated seeds from local growers — supporting food sovereignty and biodiversity across township gardens.',
        },
        description: 'A curated pack of 5 open-pollinated green vegetable seeds — typically including spinach, Swiss chard, kale, mustard greens, and amaranth. All seeds are untreated, non-hybrid, and saved from locally adapted plants. Ideal for home gardens, community plots, and school gardens.',
        nutrition: [
            { label: 'Varieties',    value: '5 types' },
            { label: 'Seeds/pack',   value: '±200 seeds total' },
            { label: 'Germination',  value: '75–90% typical' },
            { label: 'Season',       value: 'Year-round (CT)' },
        ],
        reviews: [
            { author: 'Priya N.',  rating: 5, date: 'March 2026', body: 'Every single variety germinated. My garden is thriving and I have already saved seeds for next season.' },
            { author: 'Gert V.',   rating: 5, date: 'February 2026', body: 'Great selection for a Cape Town garden. The Swiss chard especially is doing very well.' },
        ],
    },

    8: {
        id:        '8',
        name:      'Hand Hoe',
        category:  'Equipment',
        price:     120,
        priceUnit: 'per unit',
        stock:     'In Stock',
        image:     'media/hoe-products.jpeg',
        badge:     'Equipment',
        chips: [
            { label: 'Material', value: 'Steel head, wood handle' },
            { label: 'Length',   value: '120 cm' },
            { label: 'Weight',   value: '±800g' },
            { label: 'Origin',   value: 'South Africa' },
        ],
        farmer: {
            name:       'Roots Tools',
            location:   'Cape Town, Western Cape',
            note:       'We source durable, locally made hand tools from South African manufacturers and distribute them directly to community gardeners at fair prices.',
        },
        description: 'A sturdy, locally made hand hoe suitable for community plots and home gardens. The forged steel head holds an edge well and handles hard Cape soil. The 120 cm hardwood handle provides good leverage for bed preparation, weeding, and hilling. Built to last with proper care.',
        nutrition: [
            { label: 'Head width', value: '14 cm' },
            { label: 'Handle',     value: 'Hardwood, 120 cm' },
            { label: 'Warranty',   value: '1 year' },
            { label: 'Made in',    value: 'South Africa' },
        ],
        reviews: [
            { author: 'Mandla S.', rating: 5, date: 'April 2026', body: 'Solid tool. I have been using it for 3 months on hard soil and the head is still sharp. Very good quality.' },
            { author: 'Susan F.',  rating: 4, date: 'March 2026', body: 'Well made and comfortable to use. Heavier than I expected but very effective in our clay soil.' },
        ],
    },

    9: {
        id:        '9',
        name:      'Cabbage (each)',
        category:  'Vegetables',
        price:     25,
        priceUnit: 'per head',
        stock:     'In Stock',
        image:     'media/cabbage-products.jpeg',
        badge:     'Vegetables',
        chips: [
            { label: 'Weight',  value: '±1.2 – 1.8kg' },
            { label: 'Variety', value: 'Drumhead & Savoy' },
            { label: 'Method',  value: 'Naturally grown' },
            { label: 'Origin',  value: 'Nyanga, CT' },
        ],
        farmer: {
            name:       'Nyanga Community Farm',
            location:   'Nyanga, Cape Town',
            note:       'A 24-plot farm in Nyanga growing cabbages year-round using rainwater collection and natural pest control — no synthetic chemicals used on any plot.',
        },
        description: 'Dense, crisp cabbages harvested fresh from community plots in Nyanga. A South African kitchen essential — perfect for coleslaw, braised dishes, stews, vetkoek fillings, and boontjiesop. Storage: keep whole in the fridge crisper for up to 2 weeks. Once cut, wrap tightly and use within 4 days.',
        nutrition: [
            { label: 'Energy',           value: '25 kcal / 100g' },
            { label: 'Protein',          value: '1.3g' },
            { label: 'Carbohydrates',    value: '5.8g' },
            { label: 'of which sugars',  value: '3.2g' },
            { label: 'Fat',              value: '0.1g' },
            { label: 'Fibre',            value: '2.5g' },
            { label: 'Vitamin C',        value: '36mg' },
            { label: 'Vitamin K',        value: '76mcg' },
        ],
        reviews: [
            { author: 'Zanele B.',  rating: 5, date: 'April 2026', body: 'Fresh, tight heads and very good size. Made a big pot of cabbage soup and it was delicious.' },
            { author: 'Andrew C.', rating: 4, date: 'March 2026', body: 'Solid cabbage. Crisp and fresh when it arrived. The savoy variety I got was perfect for coleslaw.' },
        ],
    },

        10: {
        id:        '10',
        name:      'Gardening Gloves',
        category:  'Equipment',
        price:     50,
        priceUnit: 'per pair',
        stock:     'In Stock',
        image:     'media/equipment-products-1.jpg',
        badge:     'Equipment',
        chips: [
            { label: 'Material', value: 'Latex' },
            { label: 'Origin',   value: 'South Africa' },
        ],
        farmer: {
            name:       'Roots Tools',
            location:   'Cape Town, Western Cape',
            note:       'We source durable, locally made hand tools from South African manufacturers and distribute them directly to community gardeners at fair prices.',
        },
        description: 'A sturdy, locally made gloves suitable for community plots and home gardens. The latex coating provides good grip and protection while allowing for dexterity. Ideal for weeding, planting, and general garden maintenance. Built to last with proper care.',
        nutrition: [

            { label: 'Made in',    value: 'South Africa' },
        ],
        reviews: [
            { author: 'Zandile S.', rating: 5, date: 'April 2026', body: 'Great Gloves, very comfortable and durable.' },
            { author: 'Mark F.',  rating: 4, date: 'March 2026', body: 'Well made and comfortable to use.' },
        ],
    },
};


