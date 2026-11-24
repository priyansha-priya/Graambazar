/**
 * Universal Category Taxonomy
 * Strictly separates Food categories from Grocery categories.
 */

export interface CategoryItem {
  id: string;
  name: string;
  hindiName: string;
  catalogueType: 'FOOD' | 'GROCERY';
  icon: string;
  description: string;
}

export const FOOD_CATEGORIES: CategoryItem[] = [
  {
    id: 'food_all',
    name: 'All Food',
    hindiName: 'सभी भोजन',
    catalogueType: 'FOOD',
    icon: 'Utensils',
    description: 'Explore all prepared dishes, meals, snacks and drinks',
  },
  {
    id: 'thali_meals',
    name: 'Thali & Meals',
    hindiName: 'थाली और भोजन',
    catalogueType: 'FOOD',
    icon: 'CookingPot',
    description: 'Shuddh Shakahari & Special Thalis, Roti, Dal, Sabzi',
  },
  {
    id: 'snacks_chaat',
    name: 'Snacks & Chaat',
    hindiName: 'नाश्ता और चाट',
    catalogueType: 'FOOD',
    icon: 'Cookie',
    description: 'Samosa, Kachori, Pakoda, Chaat, Tikki',
  },
  {
    id: 'sweets_mithai',
    name: 'Sweets & Mithai',
    hindiName: 'मिठाई',
    catalogueType: 'FOOD',
    icon: 'Cake',
    description: 'Gulab Jamun, Jalebi, Rasgulla, Peda, Barfi',
  },
  {
    id: 'tea_drinks',
    name: 'Tea & Cold Drinks',
    hindiName: 'चाय और पेय',
    catalogueType: 'FOOD',
    icon: 'Coffee',
    description: 'Desi Kulhad Chai, Lassi, Chaas, Cold Drinks',
  },
];

export const GROCERY_CATEGORIES: CategoryItem[] = [
  {
    id: 'grocery_all',
    name: 'All Grocery',
    hindiName: 'सभी किराना',
    catalogueType: 'GROCERY',
    icon: 'ShoppingBag',
    description: 'Grains, pulses, spices, oils, and daily essentials',
  },
  {
    id: 'atta_flour',
    name: 'Atta & Flours',
    hindiName: 'आटा और मैदा',
    catalogueType: 'GROCERY',
    icon: 'Wheat',
    description: 'Chakki Atta, Besan, Maida, Sooji, Makka Atta',
  },
  {
    id: 'dal_pulses',
    name: 'Dal & Pulses',
    hindiName: 'दाल और दालें',
    catalogueType: 'GROCERY',
    icon: 'Boxes',
    description: 'Arhar Dal, Chana Dal, Moong, Masoor, Rajma',
  },
  {
    id: 'oil_ghee',
    name: 'Oil & Desi Ghee',
    hindiName: 'तेल और घी',
    catalogueType: 'GROCERY',
    icon: 'Droplet',
    description: 'Mustard Oil (Sarson), Refined, Desi Danedaar Ghee',
  },
  {
    id: 'spices_masale',
    name: 'Spices & Salt',
    hindiName: 'मसाले और नमक',
    catalogueType: 'GROCERY',
    icon: 'Sparkles',
    description: 'Haldi, Dhaniya, Lal Mirch, Garam Masala, Sendha Namak',
  },
  {
    id: 'dairy_daily',
    name: 'Dairy & Daily Needs',
    hindiName: 'दूध और दैनिक जरूरतें',
    catalogueType: 'GROCERY',
    icon: 'Milk',
    description: 'Fresh Milk, Paneer, Dahi, Bread, Eggs, Sugar, Tea Leaves',
  },
];
