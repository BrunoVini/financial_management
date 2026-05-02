<script lang="ts">
  import { LayoutDashboard, Calendar, TrendingUp, Settings as Cog } from 'lucide-svelte';
  import { t } from '@/i18n';
  import { link, router } from 'svelte-spa-router';

  const items = [
    { href: '/', icon: LayoutDashboard, key: 'nav.overview' },
    { href: '/months', icon: Calendar, key: 'nav.months' },
    { href: '/investments', icon: TrendingUp, key: 'nav.investments' },
    { href: '/settings', icon: Cog, key: 'nav.settings' },
  ];

  function isActive(href: string, current: string): boolean {
    return current === href || (href !== '/' && current.startsWith(href));
  }
</script>

<aside>
  <nav>
    {#each items as item (item.href)}
      {@const Icon = item.icon}
      <a href={item.href} use:link class:active={isActive(item.href, router.location)}>
        <Icon size={18} />
        <span>{$t(item.key)}</span>
      </a>
    {/each}
  </nav>
</aside>

<style>
  aside {
    width: 220px;
    padding: var(--space-5) var(--space-4);
    border-right: 1px solid var(--border-subtle);
    background: var(--bg-raised);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  a {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    text-decoration: none;
    transition:
      background var(--motion-fast),
      color var(--motion-fast);
  }
  a:hover {
    background: var(--bg-glass);
    color: var(--text-primary);
  }
  a.active {
    background: var(--accent-gradient);
    color: white;
  }
  @media (max-width: 768px) {
    aside {
      display: none;
    }
  }
</style>
