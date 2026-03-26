// Complete category list for Xplora
export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "luxury",
    name: "Luxury & Stay",
    icon: "🏨",
    subcategories: [
      "Resorts & Luxury Stays",
      "Mid Range Stays",
      "Budget / Average Stays",
      "Honeymoon Packages",
    ],
  },
  {
    id: "nature",
    name: "Nature & Adventure",
    icon: "🏔️",
    subcategories: [
      "Adventure & Trekking Tours",
      "Wildlife Safari Tours",
      "Hill Station Packages",
      "Jungle Resorts / Jeep Safari",
      "Water Sports",
    ],
  },
  {
    id: "culture",
    name: "Culture & Experiences",
    icon: "🎭",
    subcategories: [
      "Tea & Spice Plantation Tours",
      "Cultural & Heritage Tours",
      "Village & Rural Tours",
      "Photography Tours",
      "Bird Watching Tours",
    ],
  },
  {
    id: "events",
    name: "Events & Groups",
    icon: "🎉",
    subcategories: [
      "Destination Weddings",
      "Corporate Events & Functions",
      "Group & Corporate Tours",
      "Festival & Event Tours",
    ],
  },
  {
    id: "wellness",
    name: "Wellness & Spiritual",
    icon: "🧘",
    subcategories: [
      "Temple & Pilgrimage Tours",
      "Ayurveda & Wellness Retreats",
      "Medical Tourism",
    ],
  },
  {
    id: "signature",
    name: "Kerala Signature",
    icon: "🚤",
    subcategories: ["Houseboat / Homestays", "Beach & Coastal Tours"],
  },
];
