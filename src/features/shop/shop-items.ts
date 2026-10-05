import { Award, BookOpen, Building2, Gift, Recycle, TreePine, UtensilsCrossed } from 'lucide-react';

export const ITEMS = [
  {
    slug: 'city-service-priority',
    icon: Building2,
    title: 'City Service Priority',
    description: 'Skip the line for municipal permit applications',
    cost: 50,
  },
  {
    slug: 'restaurant-discount',
    icon: UtensilsCrossed,
    title: 'Restaurant Discount',
    description: 'Special discount at partnered local restaurants',
    cost: 30,
  },
  {
    slug: 'community-reward',
    icon: Gift,
    title: 'Community Reward',
    description: 'Exclusive Migsel merchandise and vouchers',
    cost: 20,
  },
  {
    slug: 'eco-friendly-kit',
    icon: Recycle,
    title: 'Eco-Friendly Kit',
    description: 'Reusable bags, bottles, and sustainable goodies',
    cost: 40,
  },
  {
    slug: 'tree-planting-voucher',
    icon: TreePine,
    title: 'Tree Planting Voucher',
    description: 'Plant a tree in your name in the city park',
    cost: 60,
  },
  {
    slug: 'library-membership',
    icon: BookOpen,
    title: 'Library Membership',
    description: 'Premium library membership with extended borrowing',
    cost: 25,
  },
  {
    slug: 'volunteer-badge',
    icon: Award,
    title: 'Volunteer Badge',
    description: 'Exclusive profile badge and recognition certificate',
    cost: 15,
  },
  {
    slug: 'parking-permit',
    icon: Building2,
    title: 'Parking Permit',
    description: 'Discounted city parking permit for 3 months',
    cost: 45,
  },
];
