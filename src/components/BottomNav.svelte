<script lang="ts">
  import { LayoutDashboard, Calendar, TrendingUp, Settings as Cog } from 'lucide-svelte';
  import { t } from '@/i18n';
  import { link, location } from 'svelte-spa-router';

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

<nav>
  {#each items as item (item.href)}
    {@const Icon = item.icon}
    <a href={item.href} use:link class:active={isActive(item.href, $location)}>
      <Icon size={20} />
      <span>{$t(item.key)}</span>
    </a>
  {/each}
</nav>

<style>
  nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: var(--bg-raised);
    border-top: 1px solid var(--border-subtle);
    padding: var(--space-2);
    gap: var(--space-1);
    justify-content: space-around;
    z-index: 10;
  }
  a {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-2);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 10px;
    min-height: 44px;
  }
  a.active {
    color: var(--accent-primary);
  }
  @media (max-width: 768px) {
    nav {
      display: flex;
    }
  }
</style>
