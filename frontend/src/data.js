export const CATEGORIES = [
  'All',
  'North Indian',
  'South Indian',
  'Street Food',
  'Desserts'
];

export const DISHES = [
  {
    id: 1,
    name: 'Butter Chicken',
    category: 'North Indian',
    price: 320,
    rating: 4.7,
    prepTime: '35 min',
    isBestseller: true,
    image:
      'https://images.pexels.com/photos/1117862/pexels-photo-1117862.jpeg?auto=compress&w=800',
    tags: ['Creamy', 'Rich', 'Non-veg']
  },
  {
    id: 2,
    name: 'Paneer Tikka',
    category: 'North Indian',
    price: 260,
    rating: 4.5,
    prepTime: '25 min',
    isBestseller: false,
    image:
      'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg?auto=compress&w=800',
    tags: ['Tandoor', 'Spicy', 'Veg']
  },
  {
    id: 3,
    name: 'Masala Dosa',
    category: 'South Indian',
    price: 180,
    rating: 4.6,
    prepTime: '20 min',
    isBestseller: true,
    image:
      'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&w=800',
    tags: ['Crispy', 'Veg', 'Light']
  },
  {
    id: 4,
    name: 'Idli Sambar',
    category: 'South Indian',
    price: 140,
    rating: 4.4,
    prepTime: '18 min',
    isBestseller: false,
    image:
      'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&w=800',
    tags: ['Soft', 'Healthy', 'Veg']
  },
  {
    id: 5,
    name: 'Pani Puri Platter',
    category: 'Street Food',
    price: 130,
    rating: 4.8,
    prepTime: '15 min',
    isBestseller: true,
    image:
      'https://images.pexels.com/photos/1439239/pexels-photo-1439239.jpeg?auto=compress&w=800',
    tags: ['Crispy', 'Tangy', 'Veg']
  },
  {
    id: 6,
    name: 'Pav Bhaji',
    category: 'Street Food',
    price: 160,
    rating: 4.6,
    prepTime: '22 min',
    isBestseller: false,
    image:
      'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&w=800',
    tags: ['Buttery', 'Spicy', 'Veg']
  },
  {
    id: 7,
    name: 'Gulab Jamun (4 pcs)',
    category: 'Desserts',
    price: 120,
    rating: 4.9,
    prepTime: '10 min',
    isBestseller: true,
    image:
      'https://images.pexels.com/photos/4109990/pexels-photo-4109990.jpeg?auto=compress&w=800',
    tags: ['Sweet', 'Hot', 'Classic']
  },
  {
    id: 8,
    name: 'Rasmalai (2 pcs)',
    category: 'Desserts',
    price: 140,
    rating: 4.7,
    prepTime: '10 min',
    isBestseller: false,
    image:
      'https://images.pexels.com/photos/4109993/pexels-photo-4109993.jpeg?auto=compress&w=800',
    tags: ['Chilled', 'Creamy', 'Festive']
  }
];

export const TESTIMONIALS = [
  {
    name: 'Aditi Sharma',
    role: 'Food Blogger',
    text: 'Khanna Khazana has become my go-to for late-night cravings. Super fast delivery and piping hot food every time!',
  },
  {
    name: 'Rahul Mehra',
    role: 'Young Professional',
    text: 'Love the variety of Indian dishes and the clean UI. Ordering my lunch is literally a 30-second job now.',
  },
  {
    name: 'Priya Nair',
    role: 'Working Mom',
    text: 'The scheduled delivery option is a lifesaver on busy weekdays. My kids are fans of their dosas and desserts!',
  }
];
