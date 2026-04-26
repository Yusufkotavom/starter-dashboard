import { NavGroup } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 *
 * Agency Dashboard — Module States:
 *   enabled  → visible in nav (default)
 *   disabled → add `visible: () => false` to hide from nav (code preserved)
 *   removed  → deleted via `node scripts/cleanup.js <module>`
 *
 * RBAC Access Control (access property):
 *   access: { requireOrg: true }              — requires active Clerk org
 *   access: { permission: 'org:x:manage' }    — requires permission
 *   access: { plan: 'pro' }                   — requires subscription plan
 *   access: { role: 'admin' }                 — requires role
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Workspaces',
        url: '/dashboard/workspaces',
        icon: 'workspace',
        isActive: false,
        items: []
      },
      {
        title: 'Workspace Team',
        url: '/dashboard/workspaces/team',
        icon: 'teams',
        isActive: false,
        items: [],
        access: { requireOrg: true }
      }
    ]
  },
  {
    label: 'CRM',
    items: [
      {
        title: 'Clients',
        url: '/dashboard/clients',
        icon: 'user',
        shortcut: ['c', 'l'],
        isActive: false,
        items: []
      },
      {
        title: 'Communications',
        url: '/dashboard/communications',
        icon: 'chat',
        shortcut: ['w', 'a'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Services',
    items: [
      {
        title: 'Service Catalog',
        url: '#',
        icon: 'product',
        shortcut: ['s', 'c'],
        isActive: false,
        items: [
          {
            title: 'All Services',
            url: '/dashboard/product',
            icon: 'product'
          },
          {
            title: 'Add Service',
            url: '/dashboard/product/new',
            icon: 'add'
          },
          {
            title: 'Service Types',
            url: '/dashboard/categories',
            icon: 'forms'
          }
        ]
      },
      {
        title: 'Quotations',
        url: '/dashboard/quotations',
        icon: 'page',
        shortcut: ['q', 'q'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Projects',
    items: [
      {
        title: 'All Projects',
        url: '/dashboard/projects',
        icon: 'kanban',
        shortcut: ['p', 'j'],
        isActive: false,
        items: []
      },
      {
        title: 'Task Board',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['k', 'k'],
        isActive: false,
        items: []
      },
      {
        title: 'Team',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['t', 'm'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Finance',
    items: [
      {
        title: 'Invoices',
        url: '/dashboard/invoices',
        icon: 'billing',
        shortcut: ['i', 'v'],
        isActive: false,
        items: []
      },
      {
        title: 'Payments',
        url: '/dashboard/payments',
        icon: 'billing',
        shortcut: ['p', 'y'],
        isActive: false,
        items: []
      },
      {
        title: 'Subscriptions',
        url: '/dashboard/subscriptions',
        icon: 'creditCard',
        shortcut: ['s', 'u'],
        isActive: false,
        items: [],
        visible: () => false
      },
      {
        title: 'Expenses',
        url: '/dashboard/expenses',
        icon: 'trendingDown',
        shortcut: ['e', 'x'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Reports',
    items: [
      {
        title: 'Reports',
        url: '/dashboard/reports',
        icon: 'trendingUp',
        shortcut: ['r', 'p'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Account',
    items: [
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        shortcut: ['s', 't'],
        isActive: false,
        items: []
      },
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'profile',
        shortcut: ['m', 'm'],
        isActive: false,
        items: []
      },
      {
        title: 'Notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        shortcut: ['n', 'n'],
        isActive: false,
        items: []
      },
      {
        title: 'Billing',
        url: '/dashboard/billing',
        icon: 'billing',
        shortcut: ['b', 'b'],
        isActive: false,
        items: [],
        access: { requireOrg: true }
      },
      {
        title: 'Chat',
        url: '/dashboard/chat',
        icon: 'chat',
        shortcut: ['c', 'h'],
        isActive: false,
        items: [],
        visible: () => false // disabled — re-enable when internal messaging is needed
      }
    ]
  }
];
